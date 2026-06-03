; HomeInventory Desktop - NSIS Custom Install Script
; Runs asynchronously after files are extracted to show config window
; PowerShell runs in separate process, doesn't block installer

!macro customInstall
  SetOutPath "$INSTDIR"
  File "${BUILD_RESOURCES_DIR}\post-install.ps1"
  ; Run async - installer finishes at 100%, config window opens separately
  Exec 'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Normal -File "$INSTDIR\post-install.ps1" "$INSTDIR"'
!macroend
