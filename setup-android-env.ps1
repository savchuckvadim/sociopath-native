# Скрипт для настройки Android окружения для Windows
# Запусти: .\setup-android-env.ps1

Write-Host "Настройка Android окружения для LiveKit..." -ForegroundColor Cyan

# Проверка JAVA_HOME
$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
    Write-Host "WARNING: JAVA_HOME не установлен" -ForegroundColor Yellow

    # Попытка найти Java в Android Studio
    $possiblePaths = @(
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Android\Android Studio\jre",
        "${env:ProgramFiles(x86)}\Android\Android Studio\jbr"
    )

    $foundJava = $null
    foreach ($path in $possiblePaths) {
        if (Test-Path "$path\bin\java.exe") {
            $foundJava = $path
            Write-Host "Найдена Java: $path" -ForegroundColor Green
            break
        }
    }

    if ($foundJava) {
        Write-Host "Установи JAVA_HOME вручную:" -ForegroundColor Yellow
        Write-Host "   Имя: JAVA_HOME" -ForegroundColor Gray
        Write-Host "   Значение: $foundJava" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   И добавь в Path: %JAVA_HOME%\bin" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: Java не найдена. Установи Android Studio или JDK." -ForegroundColor Red
    }
} else {
    Write-Host "OK: JAVA_HOME установлен: $javaHome" -ForegroundColor Green
    if (Test-Path "$javaHome\bin\java.exe") {
        $javaVersion = & "$javaHome\bin\java.exe" -version 2>&1 | Select-Object -First 1
        Write-Host "   Версия: $javaVersion" -ForegroundColor Gray
    }
}

Write-Host ""

# Проверка ANDROID_HOME
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = "$env:LOCALAPPDATA\Android\Sdk"
    Write-Host "WARNING: ANDROID_HOME не установлен" -ForegroundColor Yellow
    Write-Host "Установи ANDROID_HOME вручную:" -ForegroundColor Yellow
    Write-Host "   Имя: ANDROID_HOME" -ForegroundColor Gray
    Write-Host "   Значение: $androidHome" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   И добавь в Path:" -ForegroundColor Gray
    Write-Host "   - %ANDROID_HOME%\platform-tools" -ForegroundColor Gray
    Write-Host "   - %ANDROID_HOME%\emulator" -ForegroundColor Gray
} else {
    Write-Host "OK: ANDROID_HOME установлен: $androidHome" -ForegroundColor Green
}

Write-Host ""

# Создание local.properties
$localPropertiesPath = "android\local.properties"
if (-not (Test-Path $localPropertiesPath)) {
    Write-Host "Создание android/local.properties..." -ForegroundColor Cyan

    $sdkPath = if ($androidHome) { $androidHome } else { "$env:LOCALAPPDATA\Android\Sdk" }
    $sdkPath = $sdkPath -replace '\\', '\\'

    $content = "sdk.dir=$sdkPath"
    Set-Content -Path $localPropertiesPath -Value $content

    Write-Host "OK: Создан файл: $localPropertiesPath" -ForegroundColor Green
    Write-Host "   SDK путь: $sdkPath" -ForegroundColor Gray
} else {
    Write-Host "OK: Файл local.properties уже существует" -ForegroundColor Green
    $content = Get-Content $localPropertiesPath
    Write-Host "   Содержимое: $content" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Настрой переменные окружения (см. SETUP_LIVEKIT.md)" -ForegroundColor White
Write-Host "2. Перезапусти терминал/VS Code" -ForegroundColor White
Write-Host "3. Запусти: pnpm run android" -ForegroundColor White
Write-Host ""
