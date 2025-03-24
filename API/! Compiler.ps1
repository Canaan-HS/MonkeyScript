Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName PresentationFramework

$ScriptPath = $PSScriptRoot

$jsFiles = Get-ChildItem -Path $ScriptPath -Filter *.js -File # 獲取當前路徑下的第一個 Js 文件名
if ($jsFiles.Count -gt 0) {
    $jsFiles = Join-Path -Path $ScriptPath -ChildPath $jsFiles[0].Name
} else {
    $jsFiles = $ScriptPath
}

# 編譯模式名稱
$CompilerMode = @(
    "uglifyjs 美化",
    "uglifyjs 壓縮/混淆",
    "uglifyjs 壓縮/美化",
    "google-closure-compiler",
    "uglifyjs [壓縮] + google-closure-compiler",
    "google-closure-compiler + uglifyjs [壓縮/混淆]",
    "google-closure-compiler + uglifyjs [壓縮/美化]"
)

# 編譯輸出路徑
$Compile_Output_UPath = "R:\U_Compiler.js"
$Compile_Output_GPath = "R:\G_Compiler.js"

<# =========================== #>

# 定義 XAML
$xaml = @"
    <Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        Title="JavaScript Compiler"
        ResizeMode="NoResize"
        SizeToContent="WidthAndHeight"
        WindowStartupLocation="CenterScreen">
    <Grid Background="#FF20194A" Cursor="Arrow">
        <Grid.RowDefinitions>
            <RowDefinition Height="80"/>
            <!-- 路徑輸入 -->
            <RowDefinition Height="513"/>
            <!-- 模式選擇 -->
        </Grid.RowDefinitions>

        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="600"/>
            <ColumnDefinition Width="Auto"/>
        </Grid.ColumnDefinitions>

        <!-- 路徑輸入 -->
        <StackPanel Orientation="Horizontal" HorizontalAlignment="Left" VerticalAlignment="Center" Margin="28,0,0,0" Grid.ColumnSpan="2">
            <TextBox Name="PathTextBox" Text="$jsFiles" Width="450" Height="50" Margin="15" FontWeight="Bold" VerticalAlignment="Center" TextAlignment="Center" VerticalContentAlignment="Center" FontSize="18" FontFamily="Arial Rounded MT Bold" SelectionTextBrush="#FF003EFF" Background="#FFB6FFFA" BorderBrush="#FF687EFF" Foreground="#FF003EFF" SelectionBrush="#FF43A9F9"/>
            <Button Name="BrowseButton" Content="📂" Width="65" Height="30" FontWeight="Bold" Cursor="Hand" FontSize="18" Foreground="#FF1A33FF" Background="#FF9FBBFF" BorderBrush="#FF6D8CDE"/>
        </StackPanel>

        <!-- 模式選擇 (Margin 四值: 左,上,右,下) [使用 template 創建, 不知道怎麼同時給予 Name 和 Text, 只好土法煉鋼] -->
        <StackPanel Name="ModesPanel" Grid.Row="1" Margin="46,5,0,0" HorizontalAlignment="Left" Width="401" Height="466" VerticalAlignment="Top">
            <ToggleButton Name="Mode0" Width="380" Height="50" Margin="8" Cursor="Hand" FontSize="14" Background="#FF7C00FE" Foreground="#FFFFFCFC" BorderBrush="#FF6D8CDE">
                <TextBlock Text="$($CompilerMode[0])" Margin="10" FontWeight="Bold" VerticalAlignment="Center"/>
            </ToggleButton>
            <ToggleButton Name="Mode1" Width="380" Height="50" Margin="8" Cursor="Hand" FontSize="14" Background="#FF7C00FE" Foreground="#FFFFFCFC" BorderBrush="#FF6D8CDE">
                <TextBlock Text="$($CompilerMode[1])" Margin="10" FontWeight="Bold" VerticalAlignment="Center"/>
            </ToggleButton>
            <ToggleButton Name="Mode2" Width="380" Height="50" Margin="8" Cursor="Hand" FontSize="14" Background="#FF7C00FE" Foreground="#FFFFFCFC" BorderBrush="#FF6D8CDE">
                <TextBlock Text="$($CompilerMode[2])" Margin="10" FontWeight="Bold" VerticalAlignment="Center"/>
            </ToggleButton>
            <ToggleButton Name="Mode3" Width="380" Height="50" Margin="8" Cursor="Hand" FontSize="14" Background="#FF7C00FE" Foreground="#FFFFFCFC" BorderBrush="#FF6D8CDE">
                <TextBlock Text="$($CompilerMode[3])" Margin="10" FontWeight="Bold" VerticalAlignment="Center"/>
            </ToggleButton>
            <ToggleButton Name="Mode4" Width="380" Height="50" Margin="8" Cursor="Hand" FontSize="14" Background="#FF7C00FE" Foreground="#FFFFFCFC" BorderBrush="#FF6D8CDE">
                <TextBlock Text="$($CompilerMode[4])" Margin="10" FontWeight="Bold" VerticalAlignment="Center"/>
            </ToggleButton>
            <ToggleButton Name="Mode5" Width="380" Height="50" Margin="8" Cursor="Hand" FontSize="14" Background="#FF7C00FE" Foreground="#FFFFFCFC" BorderBrush="#FF6D8CDE">
                <TextBlock Text="$($CompilerMode[5])" Margin="10" FontWeight="Bold" VerticalAlignment="Center"/>
            </ToggleButton>
            <ToggleButton Name="Mode6" Width="380" Height="50" Margin="8" Cursor="Hand" FontSize="14" Background="#FF7C00FE" Foreground="#FFFFFCFC" BorderBrush="#FF6D8CDE">
                <TextBlock Text="$($CompilerMode[6])" Margin="10" FontWeight="Bold" VerticalAlignment="Center"/>
            </ToggleButton>
        </StackPanel>

        <!-- 編譯按鈕 -->
        <StackPanel Grid.Row="1" Grid.ColumnSpan="2" Width="138" Margin="0,14,10,0"  HorizontalAlignment="Right">
            <Button Name="LibraryUpdate" Content="依賴更新" Width="100" Height="30" Margin="10" FontSize="14" FontWeight="Bold" Cursor="Hand" VerticalAlignment="Center" BorderBrush="#FF6D8CDE" Foreground="#FF1B08FF" Background="#FF9FBBFF"/>
            <Button Name="Compiler" Content="代碼編譯" Width="100" Height="30" Margin="23" FontSize="14" FontWeight="Bold" Cursor="Hand" VerticalAlignment="Center" BorderBrush="#FF6D8CDE" Foreground="#FF1B08FF" Background="#FF9FBBFF"/>
        </StackPanel>
    </Grid>
    </Window>
"@

# 使用 StringReader 來讀取 XAML
$reader = New-Object System.IO.StringReader($xaml)
$xmlReader = [System.Xml.XmlReader]::Create($reader)
$window = [Windows.Markup.XamlReader]::Load($xmlReader)

function SelectFile {
    $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
    try {
        $fileDialog.InitialDirectory = $ScriptPath
        $fileDialog.Title = "選擇文件"
        $fileDialog.Filter = "JavaScript (*.js)|*.js"

        if ($fileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
            return $fileDialog.FileName
        }
    } finally {
        $fileDialog.Dispose()
    }
    return $null
}
# 路徑選擇按鈕
$window.FindName("BrowseButton").Add_Click({
    $Select = SelectFile
    if ($Select) {
        $window.FindName("PathTextBox").Text = $Select
    }
})

# 選擇模式
$Selected = @($null)
$Mode = @{Choose=$null}

$ModePanel_Children = $window.FindName("ModesPanel").Children
$ModePanel_Children | ForEach-Object {
    $_.Add_Checked({
        param($eventSender, $e)

        if ($Selected[0]) { # 取消先前選擇的項目
            $Selected[0].IsEnabled = $true
            $Selected[0].IsChecked = $false
        }

        $Selected[0] = $eventSender
        $eventSender.IsEnabled = $false
        $Mode.Choose = $eventSender.Name
    })
}

function CMD($command) {
    Start-Process cmd.exe -ArgumentList "/c $command" -NoNewWindow -Wait
}

# 依賴更新
$window.FindName("LibraryUpdate").Add_Click({
    CMD("npm install uglify-js -g")
    CMD("npm i -g google-closure-compiler")

    [System.Windows.Forms.MessageBox]::Show(
        "依賴項目已更新", "更新完成",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
})

# 編譯按鈕
$window.FindName("Compiler").Add_Click({
    if ($null -eq $Mode.Choose) {
        [System.Windows.Forms.MessageBox]::Show(
            "需要選擇編譯模式", "未選擇模式",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        return
    }

    $Path = $window.FindName("PathTextBox").Text
    if ($null -eq $Path -or -not(Test-Path $Path)) {
        [System.Windows.Forms.MessageBox]::Show(
            "確認輸入的文件路徑是否正確", "錯誤編譯路徑",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        return
    }

    $OpenPath = $null

    switch ($Mode.Choose) {
        "Mode0" { # uglifyjs 美化
            uglifyjs $Path -b -o $Compile_Output_UPath
            $OpenPath = $Compile_Output_UPath
        }
        "Mode1" { # uglifyjs 壓縮/混淆
            uglifyjs $Path -c -m -o $Compile_Output_UPath
            $OpenPath = $Compile_Output_UPath
        }
        "Mode2" { # uglifyjs 壓縮/美化
            # uglifyjs $Path -c -o $Compile_Output_UPath # 壓縮
            uglifyjs $Path -c -b -o $Compile_Output_UPath # 壓縮美化
            $OpenPath = $Compile_Output_UPath
        }
        "Mode3" { # google-closure-compiler 預設
            google-closure-compiler $Path --js_output_file $Compile_Output_GPath
            $OpenPath = $Compile_Output_GPath
        }
        "Mode4" { # uglifyjs(壓縮) + google-closure-compiler(預設)
            uglifyjs $Path -c -o $Compile_Output_UPath
            google-closure-compiler $Compile_Output_UPath --js_output_file $Compile_Output_GPath
            $OpenPath = $Compile_Output_GPath
        }
        "Mode5" { # google-closure-compiler(預設) + uglifyjs(壓縮/混淆)
            google-closure-compiler $Path --js_output_file $Compile_Output_GPath
            uglifyjs $Compile_Output_GPath -c -m -o $Compile_Output_UPath
            $OpenPath = $Compile_Output_UPath
        }
        "Mode6" { # google-closure-compiler(預設) + uglifyjs(壓縮/美化)
            google-closure-compiler $Path --js_output_file $Compile_Output_GPath
            uglifyjs $Compile_Output_GPath -c -b -o $Compile_Output_UPath
            $OpenPath = $Compile_Output_UPath
        }
    }

    if (Test-Path $OpenPath) {
        Start-Process $OpenPath
    }
})

try {
    $window.ShowDialog() # 顯示窗口
} finally {
    $window.Close() # 釋放窗口資源
}