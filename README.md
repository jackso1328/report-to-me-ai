# Report-to-Me AI

### From observation → understanding → action

**AI-powered guidance for understanding real-world situations and deciding what to safely do next.**

[![AWS](https://img.shields.io/badge/Built%20on-AWS-orange?logo=amazonaws)](#-aws-architecture)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)](#-technology-stack)
[![Python](https://img.shields.io/badge/Backend-Python-3776AB?logo=python)](#-technology-stack)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Tell Report-to-Me AI what is happening. It helps you understand what happened, assess the risk, decide what can safely happen next, and involve the appropriate human when needed.**

**Live prototype:**  
https://jackso1328.github.io/report-to-me-ai/

---

## The Problem

Real-world problems rarely arrive as structured tickets.

Someone notices:

- a leaking tap
- unusual equipment noise
- a recurring infrastructure problem
- an unsafe situation
- a security concern
- an environmental issue

Traditional reporting systems usually ask the user to turn that messy observation into a form and then place it into a queue.

That creates a gap between:

**something happening in the real world**

and

**someone knowing what should happen next.**

Generic AI assistants can describe a situation, but allowing a language model to directly control sensitive workflows creates another problem: the model should not be the authority deciding when consequential real-world actions happen.

### Report-to-Me AI closes that gap.

It turns an unstructured observation into a structured, policy-controlled response:

```text
OBSERVE
   ↓
UNDERSTAND
   ↓
ASSESS
   ↓
GUIDE
   ↓
MONITOR
   ↓
HUMAN REVIEW WHEN REQUIRED
