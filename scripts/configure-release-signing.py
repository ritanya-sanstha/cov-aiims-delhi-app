"""Add a release signingConfig to android/app/build.gradle and use it in buildTypes.release."""
import re
import sys

path = "android/app/build.gradle"
keystore = sys.argv[1] if len(sys.argv) > 1 else "/tmp/aiims-release.keystore"

with open(path) as f:
    content = f.read()

signing_block = f"""
        release {{
            storeFile file('{keystore}')
            storePassword 'android123'
            keyAlias 'app'
            keyPassword 'android123'
        }}"""
if "signingConfigs {" not in content:
    sys.exit("signingConfigs block not found in build.gradle")
content = content.replace("signingConfigs {", "signingConfigs {" + signing_block, 1)

# Point buildTypes.release (not the signingConfigs one) at the new config.
start = content.index("buildTypes {")
head, tail = content[:start], content[start:]
m = re.search(r"\n(\s*)release \{", tail)
if not m:
    sys.exit("buildTypes.release block not found in build.gradle")
rest = tail[m.end():]
if re.search(r"signingConfig\s+signingConfigs\.\w+", rest):
    rest = re.sub(r"signingConfig\s+signingConfigs\.\w+",
                  "signingConfig signingConfigs.release", rest, count=1)
else:
    rest = "\n" + m.group(1) + "    signingConfig signingConfigs.release" + rest
tail = tail[:m.end()] + rest

with open(path, "w") as f:
    f.write(head + tail)
print("Signing config injected successfully")
