; HomeInventory Desktop - NSIS Custom Install Script
; Runs after files are extracted to show post-install config window
; Saves installer-config.json for the app to read on first launch

!macro customInstall
  SetOutPath "$INSTDIR"

  ; Include the PowerShell config script into the installer
  ; BUILD_RESOURCES_DIR points to the build/ directory
  File "${BUILD_RESOURCES_DIR}\post-install.ps1"

  ; Run PowerShell script with install dir as argument
  nsExec::ExecToStack 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\post-install.ps1" "$INSTDIR"'

  ; Clean up the temporary script
  Delete "$INSTDIR\post-install.ps1"

  ; Check if installer-config.json was created
  IfFileExists "$INSTDIR\installer-config.json" config_created config_skipped
  config_created:
    DetailPrint "Cau hinh da duoc luu."
    Goto config_done
  config_skipped:
    DetailPrint "Nguoi dung bo qua cau hinh. Setup wizard se chay khi khoi dong app."
  config_done:
!macroend
