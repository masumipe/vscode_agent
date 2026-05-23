# PowerShell script to create VS Code Ollama Agent Extension folder structure
# Execute this script to create all necessary directories

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating VS Code Ollama Agent Extension" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Create main extension directory
$mainDir = "d:\Myfiles\vscodeagent\vscode-ollama-agent-extension"
Write-Host "Creating main directory: $mainDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $mainDir | Out-Null

# Create core directories
$directories = @(
    "src",
    "src\agents",
    "src\services",
    "src\models",
    "src\utils",
    "src\config",
    "tests",
    "tests\unit",
    "tests\integration",
    ".vscode",
    ".github",
    ".github\workflows",
    "docs",
    "docs\api",
    "docs\guides",
    "examples",
    "examples\basic",
    "examples\advanced",
    "scripts",
    "assets",
    "assets\icons",
    "node_modules"
)

Write-Host "`nCreating folder structure..." -ForegroundColor Cyan
foreach ($dir in $directories) {
    $fullPath = Join-Path $mainDir $dir
    New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
    Write-Host "  ✓ Created: $dir" -ForegroundColor Green
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Folder structure created successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm init' to initialize package.json" -ForegroundColor White
Write-Host "2. Install VS Code extension dependencies" -ForegroundColor White
Write-Host "3. Continue with extension development" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
