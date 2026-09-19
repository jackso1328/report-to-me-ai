$functions = @("AnalyzeFunction", "HealthFunction", "IncidentFunction", "PresignFunction", "SignalFunction")

foreach ($func in $functions) {
    $targetDir = "C:\Users\proud\Desktop\BB\.aws-sam\build\$func"
    Write-Host "Installing to $targetDir"
    python -m pip install --platform manylinux2014_x86_64 --target $targetDir --only-binary=:all: pydantic pydantic-settings pydantic-core --python-version 3.10
}
