import yaml
import os
import unittest

class TestStepFunctionsDefinition(unittest.TestCase):
    def setUp(self):
        # Path to template.yaml
        template_path = os.path.join(os.path.dirname(__file__), '../../../template.yaml')
        with open(template_path, 'r') as f:
            # Simple parse since we just want to verify the JSON-like structure
            # PyYAML might fail on some CloudFormation intrinsics, so we load safely
            class SafeLoaderIgnoreUnknown(yaml.SafeLoader):
                pass
            
            SafeLoaderIgnoreUnknown.add_multi_constructor(
                '!',
                lambda loader, suffix, node: str(node.value) if hasattr(node, 'value') else None
            )
            
            self.template = yaml.load(f, Loader=SafeLoaderIgnoreUnknown)
            self.sfn = self.template['Resources']['HumanReviewWorkflow']['Properties']['Definition']

    def test_idempotency_guard(self):
        prepare_state = self.sfn['States']['PrepareReviewAndWait']
        self.assertEqual(prepare_state['Type'], 'Task')
        self.assertIn('FunctionName', prepare_state['Parameters'])
        
        # Verify it passes the execution ID to the Lambda for idempotency
        self.assertIn('executionId.$', prepare_state['Parameters']['Payload'])

    def test_duplicate_workflow_handled(self):
        prepare_state = self.sfn['States']['PrepareReviewAndWait']
        catch_blocks = prepare_state.get('Catch', [])
        
        # Verify it catches ConditionalCheckFailedException
        has_conditional_catch = any('DynamoDB.ConditionalCheckFailedException' in catch['ErrorEquals'] for catch in catch_blocks)
        self.assertTrue(has_conditional_catch, "Must catch duplicate workflow executions")

    def test_explicit_timeout(self):
        prepare_state = self.sfn['States']['PrepareReviewAndWait']
        self.assertEqual(prepare_state.get('TimeoutSeconds'), 86400)
        
        catch_blocks = prepare_state.get('Catch', [])
        timeout_catch = next((catch for catch in catch_blocks if 'States.Timeout' in catch['ErrorEquals']), None)
        self.assertIsNotNone(timeout_catch, "Must catch States.Timeout")
        self.assertEqual(timeout_catch['Next'], 'HandleTimeout')

    def test_timeout_behavior(self):
        timeout_state = self.sfn['States']['HandleTimeout']
        self.assertIn('reviewState = :s', timeout_state['Parameters']['UpdateExpression'])
        self.assertEqual(timeout_state['Parameters']['ExpressionAttributeValues'][':s']['S'], 'timed_out')
        
        # Does not dispatch, goes to audit
        self.assertEqual(timeout_state['Next'], 'PersistTimeoutAuditRecord')

    def test_terminal_states(self):
        approved = self.sfn['States']['UpdateStatusApproved']
        self.assertEqual(approved['Next'], 'PersistAuditRecord')
        self.assertIn('reviewState = :s', approved['Parameters']['UpdateExpression'])
        
        rejected = self.sfn['States']['UpdateStatusRejected']
        self.assertEqual(rejected['Next'], 'PersistAuditRecord')
        self.assertIn('reviewState = :s', rejected['Parameters']['UpdateExpression'])

    def test_audit_records_are_immutable(self):
        persist = self.sfn['States']['PersistAuditRecord']
        self.assertEqual(persist['Type'], 'Task')
        self.assertEqual(persist['Parameters']['Item']['SK']['S.$'], "States.Format('REVIEW#{}', $$.State.EnteredTime)")
