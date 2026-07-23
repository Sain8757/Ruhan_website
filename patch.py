import os
import re
import glob

base_dir = "/Users/sain8757/Downloads/RS seva point/ra-seva-point/app/(dashboard)/pdf-tools/[toolId]/components"

for filepath in glob.glob(glob.escape(base_dir) + "/*.tsx"):
    with open(filepath, "r") as f:
        content = f.read()

    if "AddSignatureTool.tsx" in filepath: continue

    modified = False

    if "useDownload" not in content:
        content = re.sub(
            r"(import \{ useToast \} from \"@/contexts/ToastContext\";)",
            r"\1\nimport { useDownload } from \"@/contexts/DownloadContext\";",
            content
        )
        modified = True

    if "downloadWithRename" not in content:
        content = re.sub(
            r"(const toast = useToast\(\);)",
            r"\1\n  const { downloadWithRename } = useDownload();",
            content
        )
        modified = True

    download_pattern = re.compile(
        r"const\s+a\s*=\s*document\.createElement\([\"']a[\"']\);\s*a\.href\s*=\s*([a-zA-Z0-9_]+);\s*a\.download\s*=\s*([^;]+);\s*a\.click\(\);",
        re.MULTILINE
    )

    if download_pattern.search(content):
        content = download_pattern.sub(r"downloadWithRename(\1, \2);", content)
        modified = True
        
    content = re.sub(r"downloadWithRename\(([^,]+),\s*([^)]+)\);\s*URL\.revokeObjectURL\(\1\);", r"downloadWithRename(\1, \2);", content)

    if modified:
        with open(filepath, "w") as f:
            f.write(content)
        print("Updated", filepath)
