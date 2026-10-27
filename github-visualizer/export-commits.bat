@echo off
REM Export GitHub commits to commits.json
REM Usage: export-commits.bat [OWNER] [REPO]
REM If no arguments provided, will prompt for them

setlocal

set OWNER=%~1
set REPO=%~2

if "%OWNER%"=="" (
    set /p OWNER="GitHub owner (username or org): "
)
if "%REPO%"=="" (
    set /p REPO="Repository name: "
)

echo Exporting commits from %OWNER%/%REPO% ...

gh api repos/%OWNER%/%REPO%/commits --paginate --jq ".[] | {sha, message: .commit.message, author: {name: .commit.author.name, email: .commit.author.email, date: .commit.author.date}, url: .html_url}" > commits.json

if %errorlevel% equ 0 (
    echo.
    echo Success! Commits saved to commits.json
    echo.
    powershell -command "Get-Content commits.json -TotalCount 3 | ForEach-Object { $_ }"
) else (
    echo.
    echo Error: Failed to export commits
    echo Make sure 'gh' is installed and authenticated (gh auth login)
)

pause