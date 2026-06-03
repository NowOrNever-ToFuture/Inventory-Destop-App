# HomeInventory Post-Install Configuration
# Saves config file for the app to process on first launch
# Shows progress and confirmation to the user

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$configPath = Join-Path $args[0] "installer-config.json"

# ─── Create Form ─────────────────────────────────────────────
$form = New-Object System.Windows.Forms.Form
$form.Text = "HomeInventory Desktop - Cau hinh lan dau"
$form.Size = New-Object System.Drawing.Size(500, 440)
$form.StartPosition = "CenterScreen"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.FormBorderStyle = "FixedDialog"
$form.Topmost = $true

# Try to set app icon
try { $form.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Join-Path $args[0] "HomeInventory.exe")) } catch {}

$font = New-Object System.Drawing.Font("Segoe UI", 10)
$form.Font = $font

# ─── Title ──────────────────────────────────────────────────
$title = New-Object System.Windows.Forms.Label
$title.Text = "Cau hinh HomeInventory Desktop"
$title.Location = New-Object System.Drawing.Point(20, 15)
$title.Size = New-Object System.Drawing.Size(460, 25)
$title.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "Vui long nhap thong tin de bat dau su dung."
$subtitle.Location = New-Object System.Drawing.Point(20, 42)
$subtitle.Size = New-Object System.Drawing.Size(460, 20)
$subtitle.ForeColor = [System.Drawing.Color]::Gray
$form.Controls.Add($subtitle)

# ─── Step Indicator ──────────────────────────────────────────
$stepLabel = New-Object System.Windows.Forms.Label
$stepLabel.Text = "Buoc 1/4: Duong dan luu du lieu"
$stepLabel.Location = New-Object System.Drawing.Point(20, 72)
$stepLabel.Size = New-Object System.Drawing.Size(460, 18)
$stepLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Italic)
$stepLabel.ForeColor = [System.Drawing.Color]::Blue
$form.Controls.Add($stepLabel)

$currentStep = 1
function Set-Step($num, $text) {
    $script:currentStep = $num
    $stepLabel.Text = "Buoc $num/4: $text"
}

# ─── Data Path ──────────────────────────────────────────────
$lblData = New-Object System.Windows.Forms.Label
$lblData.Text = "Duong dan luu CSDL + anh hoa don:"
$lblData.Location = New-Object System.Drawing.Point(20, 98)
$lblData.Size = New-Object System.Drawing.Size(460, 20)
$form.Controls.Add($lblData)

$txtData = New-Object System.Windows.Forms.TextBox
$txtData.Text = Join-Path $env:APPDATA "HomeInventory"
$txtData.Location = New-Object System.Drawing.Point(20, 120)
$txtData.Size = New-Object System.Drawing.Size(380, 22)
$form.Controls.Add($txtData)

$btnData = New-Object System.Windows.Forms.Button
$btnData.Text = "..."
$btnData.Location = New-Object System.Drawing.Point(405, 118)
$btnData.Size = New-Object System.Drawing.Size(35, 25)
$btnData.Add_Click({
    $folder = New-Object System.Windows.Forms.FolderBrowserDialog
    $folder.Description = "Chon thu muc luu du lieu"
    $folder.SelectedPath = $txtData.Text
    if ($folder.ShowDialog() -eq "OK") { $txtData.Text = $folder.SelectedPath; Set-Step 1 "Duong dan luu du lieu" }
})
$form.Controls.Add($btnData)

# ─── Username ──────────────────────────────────────────────
$lblUser = New-Object System.Windows.Forms.Label
$lblUser.Text = "Ten dang nhap:"
$lblUser.Location = New-Object System.Drawing.Point(20, 158)
$lblUser.Size = New-Object System.Drawing.Size(200, 20)
$form.Controls.Add($lblUser)

$txtUser = New-Object System.Windows.Forms.TextBox
$txtUser.Text = "admin"
$txtUser.Location = New-Object System.Drawing.Point(20, 180)
$txtUser.Size = New-Object System.Drawing.Size(200, 22)
$form.Controls.Add($txtUser)

$lblPass = New-Object System.Windows.Forms.Label
$lblPass.Text = "Mat khau (>=4 ky tu):"
$lblPass.Location = New-Object System.Drawing.Point(240, 158)
$lblPass.Size = New-Object System.Drawing.Size(240, 20)
$form.Controls.Add($lblPass)

$txtPass = New-Object System.Windows.Forms.TextBox
$txtPass.UseSystemPasswordChar = $true
$txtPass.Text = "admin@123"
$txtPass.Location = New-Object System.Drawing.Point(240, 180)
$txtPass.Size = New-Object System.Drawing.Size(200, 22)
$form.Controls.Add($txtPass)

# ─── Store Name ─────────────────────────────────────────────
$lblStore = New-Object System.Windows.Forms.Label
$lblStore.Text = "Ten cua hang:"
$lblStore.Location = New-Object System.Drawing.Point(20, 218)
$lblStore.Size = New-Object System.Drawing.Size(460, 20)
$form.Controls.Add($lblStore)

$txtStore = New-Object System.Windows.Forms.TextBox
$txtStore.Text = "HomeInventory"
$txtStore.Location = New-Object System.Drawing.Point(20, 240)
$txtStore.Size = New-Object System.Drawing.Size(420, 22)
$form.Controls.Add($txtStore)

# ─── Note ───────────────────────────────────────────────────
$note = New-Object System.Windows.Forms.Label
$note.Text = "Co the thay doi thong tin nay sau trong phan Cai dat cua ung dung."
$note.Location = New-Object System.Drawing.Point(20, 275)
$note.Size = New-Object System.Drawing.Size(460, 20)
$note.ForeColor = [System.Drawing.Color]::Gray
$form.Controls.Add($note)

# ─── Status / Progress ─────────────────────────────────────
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = ""
$statusLabel.Location = New-Object System.Drawing.Point(20, 300)
$statusLabel.Size = New-Object System.Drawing.Size(460, 40)
$statusLabel.ForeColor = [System.Drawing.Color]::Green
$statusLabel.Visible = $false
$form.Controls.Add($statusLabel)

$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(20, 340)
$progressBar.Size = New-Object System.Drawing.Size(440, 20)
$progressBar.Style = "Continuous"
$progressBar.Visible = $false
$form.Controls.Add($progressBar)

# ─── Buttons ───────────────────────────────────────────────
$btnOK = New-Object System.Windows.Forms.Button
$btnOK.Text = "Hoan tat"
$btnOK.Location = New-Object System.Drawing.Point(280, 370)
$btnOK.Size = New-Object System.Drawing.Size(100, 30)

$btnOK.Add_Click({
    # Validate
    if ($txtUser.Text.Trim() -eq "") {
        [System.Windows.Forms.MessageBox]::Show("Vui long nhap ten dang nhap.", "Loi", 0, 48) | Out-Null
        return
    }
    if ($txtPass.Text.Length -lt 4) {
        [System.Windows.Forms.MessageBox]::Show("Mat khau phai co it nhat 4 ky tu.", "Loi", 0, 48) | Out-Null
        return
    }

    # Show progress
    $btnOK.Enabled = $false
    $btnCancel.Enabled = $false
    $statusLabel.Visible = $true
    $progressBar.Visible = $true
    $form.Refresh()

    # ─── Save config with progress ─────────────────────────
    $statusLabel.ForeColor = [System.Drawing.Color]::Blue
    $statusLabel.Text = "Dang luu cau hinh..."
    $progressBar.Value = 30
    $form.Refresh()
    Start-Sleep -Milliseconds 300

    $config = @{
        dataPath       = $txtData.Text.Trim()
        username       = $txtUser.Text.Trim()
        password       = $txtPass.Text
        storeName      = if ($txtStore.Text.Trim() -ne "") { $txtStore.Text.Trim() } else { "HomeInventory" }
        setupComplete  = $true
    }

    $config | ConvertTo-Json | Out-File -FilePath $configPath -Encoding UTF8

    $progressBar.Value = 70
    $statusLabel.Text = "Da luu cau hinh."
    $form.Refresh()
    Start-Sleep -Milliseconds 300

    # ─── Done ──────────────────────────────────────────────
    $progressBar.Value = 100
    $statusLabel.ForeColor = [System.Drawing.Color]::Green
    $statusLabel.Text = "Hoan tat! Ung dung se tu dong cai dat khi khoi dong."
    $form.Refresh()
    Start-Sleep -Milliseconds 800

    # Show confirmation
    [System.Windows.Forms.MessageBox]::Show(
        "Cau hinh da duoc luu thanh cong!$\n$\nKhi chay ung dung lan dau, phan mem se tu dong:$\n- Tao co so du lieu$\n- Tao tai khoan quan tri$\n- Thiet lap ten cua hang$\n- Tao thu muc luu anh hoa don$\n$\nVui long mo ung dung de hoan tat qua trinh cai dat.",
        "Hoan tat cau hinh",
        0, 64
    ) | Out-Null

    $form.DialogResult = "OK"
    $form.Close()
})
$form.Controls.Add($btnOK)

$btnCancel = New-Object System.Windows.Forms.Button
$btnCancel.Text = "Bo qua"
$btnCancel.Location = New-Object System.Drawing.Point(170, 370)
$btnCancel.Size = New-Object System.Drawing.Size(100, 30)
$btnCancel.Add_Click({
    $config = @{ setupComplete = $false }
    $config | ConvertTo-Json | Out-File -FilePath $configPath -Encoding UTF8
    $form.DialogResult = "Cancel"
    $form.Close()
})
$form.Controls.Add($btnCancel)

# ─── Show Form ──────────────────────────────────────────────
$form.ShowDialog() | Out-Null

# ─── Cleanup: delete this script after use ─────────────────
Start-Sleep -Milliseconds 100
$scriptPath = Join-Path $args[0] "post-install.ps1"
if (Test-Path $scriptPath) {
    try { Remove-Item -Path $scriptPath -Force -ErrorAction SilentlyContinue } catch {}
}
