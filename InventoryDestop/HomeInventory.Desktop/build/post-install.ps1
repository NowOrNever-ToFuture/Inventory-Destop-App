# HomeInventory Post-Install Configuration
# Runs after installation to collect user setup info
# Creates installer-config.json for the app to read on first launch

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$configPath = Join-Path $args[0] "installer-config.json"

# Create form
$form = New-Object System.Windows.Forms.Form
$form.Text = "HomeInventory Desktop - Cau hinh lan dau"
$form.Size = New-Object System.Drawing.Size(480, 400)
$form.StartPosition = "CenterScreen"
$form.MaximizeBox = $false
$form.FormBorderStyle = "FixedDialog"
$form.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Join-Path $args[0] "HomeInventory.exe"))

# Font
$font = New-Object System.Drawing.Font("Segoe UI", 10)
$form.Font = $font

# Title label
$title = New-Object System.Windows.Forms.Label
$title.Text = "Vui long cau hinh thong tin ban dau"
$title.Location = New-Object System.Drawing.Point(20, 20)
$title.Size = New-Object System.Drawing.Size(440, 25)
$title.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($title)

# ---- Data Path ----
$lblData = New-Object System.Windows.Forms.Label
$lblData.Text = "Duong dan luu du lieu (CSDL + anh hoa don):"
$lblData.Location = New-Object System.Drawing.Point(20, 60)
$lblData.Size = New-Object System.Drawing.Size(440, 20)
$form.Controls.Add($lblData)

$txtData = New-Object System.Windows.Forms.TextBox
$txtData.Text = Join-Path $env:APPDATA "HomeInventory"
$txtData.Location = New-Object System.Drawing.Point(20, 82)
$txtData.Size = New-Object System.Drawing.Size(360, 22)
$form.Controls.Add($txtData)

$btnData = New-Object System.Windows.Forms.Button
$btnData.Text = "..."
$btnData.Location = New-Object System.Drawing.Point(385, 80)
$btnData.Size = New-Object System.Drawing.Size(35, 25)
$btnData.Add_Click({
    $folder = New-Object System.Windows.Forms.FolderBrowserDialog
    $folder.Description = "Chon thu muc luu du lieu"
    $folder.SelectedPath = $txtData.Text
    if ($folder.ShowDialog() -eq "OK") { $txtData.Text = $folder.SelectedPath }
})
$form.Controls.Add($btnData)

# ---- Username ----
$lblUser = New-Object System.Windows.Forms.Label
$lblUser.Text = "Ten dang nhap quan tri:"
$lblUser.Location = New-Object System.Drawing.Point(20, 120)
$lblUser.Size = New-Object System.Drawing.Size(440, 20)
$form.Controls.Add($lblUser)

$txtUser = New-Object System.Windows.Forms.TextBox
$txtUser.Text = "admin"
$txtUser.Location = New-Object System.Drawing.Point(20, 142)
$txtUser.Size = New-Object System.Drawing.Size(200, 22)
$form.Controls.Add($txtUser)

# ---- Password ----
$lblPass = New-Object System.Windows.Forms.Label
$lblPass.Text = "Mat khau (it nhat 4 ky tu):"
$lblPass.Location = New-Object System.Drawing.Point(240, 120)
$lblPass.Size = New-Object System.Drawing.Size(220, 20)
$form.Controls.Add($lblPass)

$txtPass = New-Object System.Windows.Forms.TextBox
$txtPass.UseSystemPasswordChar = $true
$txtPass.Text = "admin@123"
$txtPass.Location = New-Object System.Drawing.Point(240, 142)
$txtPass.Size = New-Object System.Drawing.Size(200, 22)
$form.Controls.Add($txtPass)

# ---- Store Name ----
$lblStore = New-Object System.Windows.Forms.Label
$lblStore.Text = "Ten cua hang:"
$lblStore.Location = New-Object System.Drawing.Point(20, 180)
$lblStore.Size = New-Object System.Drawing.Size(440, 20)
$form.Controls.Add($lblStore)

$txtStore = New-Object System.Windows.Forms.TextBox
$txtStore.Text = "HomeInventory"
$txtStore.Location = New-Object System.Drawing.Point(20, 202)
$txtStore.Size = New-Object System.Drawing.Size(420, 22)
$form.Controls.Add($txtStore)

# ---- Note ----
$note = New-Object System.Windows.Forms.Label
$note.Text = "Luu y: Ban co the thay doi tat ca thong tin nay sau trong phan Cai dat."
$note.Location = New-Object System.Drawing.Point(20, 240)
$note.Size = New-Object System.Drawing.Size(440, 20)
$note.ForeColor = [System.Drawing.Color]::Gray
$form.Controls.Add($note)

# ---- Buttons ----
$btnOK = New-Object System.Windows.Forms.Button
$btnOK.Text = "Hoan tat"
$btnOK.Location = New-Object System.Drawing.Point(280, 320)
$btnOK.Size = New-Object System.Drawing.Size(100, 30)
$btnOK.Add_Click({
    # Validate
    if ($txtUser.Text.Trim() -eq "") {
        [System.Windows.Forms.MessageBox]::Show("Vui long nhap ten dang nhap.", "Loi", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        return
    }
    if ($txtPass.Text.Length -lt 4) {
        [System.Windows.Forms.MessageBox]::Show("Mat khau phai co it nhat 4 ky tu.", "Loi", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        return
    }
    # Save config
    $config = @{
        dataPath   = $txtData.Text.Trim()
        username   = $txtUser.Text.Trim()
        password   = $txtPass.Text
        storeName  = if ($txtStore.Text.Trim() -ne "") { $txtStore.Text.Trim() } else { "HomeInventory" }
        setupComplete = $true
    }
    $config | ConvertTo-Json | Out-File -FilePath $configPath -Encoding UTF8
    $form.DialogResult = "OK"
    $form.Close()
})
$form.Controls.Add($btnOK)

$btnCancel = New-Object System.Windows.Forms.Button
$btnCancel.Text = "Bo qua"
$btnCancel.Location = New-Object System.Drawing.Point(170, 320)
$btnCancel.Size = New-Object System.Drawing.Size(100, 30)
$btnCancel.Add_Click({
    # Save minimal config to skip setup
    $config = @{ setupComplete = $false }
    $config | ConvertTo-Json | Out-File -FilePath $configPath -Encoding UTF8
    $form.DialogResult = "Cancel"
    $form.Close()
})
$form.Controls.Add($btnCancel)

# Show form
$form.Topmost = $true
$form.ShowDialog() | Out-Null
