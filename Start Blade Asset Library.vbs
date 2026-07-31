Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "py """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\window.py""", 0, False