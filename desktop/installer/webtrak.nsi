; WebTrak for Windows — a small, standard NSIS installer.
;
;   WebTrak-<version>-win-x64.exe              one click, per user (no administrator rights needed)
;   WebTrak-<version>-win-x64.exe /S           silent
;   WebTrak-<version>-win-x64.exe /S /ALLUSERS machine-wide for everyone on the PC (run as administrator / SYSTEM,
;                                              e.g. from Intune or a deployment script)
;
; Compile (see ../README.md):  makensis -DVERSION=1.0.0 -DSOURCE_DIR=<win-unpacked> -DOUT_FILE=<exe> webtrak.nsi

Unicode true
SetCompressor /SOLID lzma
ManifestDPIAware true

!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!ifndef SOURCE_DIR
  !define SOURCE_DIR "..\dist\win-unpacked"
!endif
!ifndef OUT_FILE
  !define OUT_FILE "..\dist\WebTrak-${VERSION}-win-x64.exe"
!endif

!define APP_NAME "WebTrak"
!define APP_EXE "webtrak.exe"
!define PUBLISHER "Webknot Technologies"
!define APP_ID "in.webknot.webtrak"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}"

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

Name "${APP_NAME}"
OutFile "${OUT_FILE}"
BrandingText "${PUBLISHER}"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\${APP_NAME}"
ShowInstDetails nevershow
ShowUnInstDetails nevershow
AutoCloseWindow true

VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "CompanyName" "${PUBLISHER}"
VIAddVersionKey "FileDescription" "${APP_NAME} installer"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "© ${PUBLISHER}"

!define MUI_ICON "..\build\icon.ico"
!define MUI_UNICON "..\build\icon.ico"
!define MUI_ABORTWARNING
!define MUI_INSTFILESPAGE_COLORS "FFFFFF 1E293B"
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Var AllUsers

Function .onInit
  ${GetParameters} $0
  ${GetOptions} $0 "/ALLUSERS" $1
  ${IfNot} ${Errors}
    StrCpy $AllUsers "1"
    ; Machine-wide needs administrator rights (an elevated prompt, or SYSTEM from a deployment tool).
    UserInfo::GetAccountType
    Pop $2
    ${If} $2 != "Admin"
      MessageBox MB_OK|MB_ICONSTOP "Installing for all users needs administrator rights. Run the installer as administrator, or install just for yourself by leaving out /ALLUSERS."
      Abort
    ${EndIf}
    SetShellVarContext all
    ${If} ${RunningX64}
      StrCpy $INSTDIR "$PROGRAMFILES64\${APP_NAME}"
    ${Else}
      StrCpy $INSTDIR "$PROGRAMFILES\${APP_NAME}"
    ${EndIf}
  ${Else}
    StrCpy $AllUsers "0"
    SetShellVarContext current
  ${EndIf}
  ; Upgrading: close a running copy first so its files can be replaced.
  nsExec::Exec 'taskkill /F /IM ${APP_EXE}'
  Pop $0
FunctionEnd

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${SOURCE_DIR}\*.*"
  File "/oname=$INSTDIR\webtrak.ico" "..\build\icon.ico"

  CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\webtrak.ico" 0
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\webtrak.ico" 0
  CreateShortCut "$SMPROGRAMS\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\webtrak.ico" 0
  ; Lets Windows tie notifications and taskbar pinning to the app.
  WriteRegStr SHCTX "Software\Classes\AppUserModelId\${APP_ID}" "DisplayName" "${APP_NAME}"

  WriteUninstaller "$INSTDIR\Uninstall ${APP_NAME}.exe"
  WriteRegStr SHCTX "${UNINSTALL_KEY}" "DisplayName" "${APP_NAME}"
  WriteRegStr SHCTX "${UNINSTALL_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr SHCTX "${UNINSTALL_KEY}" "Publisher" "${PUBLISHER}"
  WriteRegStr SHCTX "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\webtrak.ico"
  WriteRegStr SHCTX "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr SHCTX "${UNINSTALL_KEY}" "UninstallString" '"$INSTDIR\Uninstall ${APP_NAME}.exe" /$AllUsers'
  WriteRegStr SHCTX "${UNINSTALL_KEY}" "QuietUninstallString" '"$INSTDIR\Uninstall ${APP_NAME}.exe" /S'
  WriteRegDWORD SHCTX "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD SHCTX "${UNINSTALL_KEY}" "NoRepair" 1
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD SHCTX "${UNINSTALL_KEY}" "EstimatedSize" "$0"
SectionEnd

Function .onInstSuccess
  ; Open WebTrak for people installing by hand; deployments (/S) stay quiet.
  ${IfNot} ${Silent}
    Exec '"$INSTDIR\${APP_EXE}"'
  ${EndIf}
FunctionEnd

Function un.onInit
  ; Remove the same scope that was installed (machine-wide installs record it in HKLM).
  ReadRegStr $0 HKLM "${UNINSTALL_KEY}" "InstallLocation"
  ${If} $0 == "$INSTDIR"
    SetShellVarContext all
  ${Else}
    SetShellVarContext current
  ${EndIf}
FunctionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM ${APP_EXE}'
  Pop $0
  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"
  DeleteRegKey SHCTX "Software\Classes\AppUserModelId\${APP_ID}"
  DeleteRegKey SHCTX "${UNINSTALL_KEY}"
  RMDir /r "$INSTDIR"
SectionEnd
