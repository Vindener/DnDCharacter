import json

UA_DIR = "/home/vindener/Files/Projects/DnDCharacter/.ua"
fn = json.load(open(f"{UA_DIR}/tmp/ua-arch-fileNodes.json"))

ROOT_INFRA_FILES = {
    "App.tsx", "index.js", ".env", "app.json", "eas.json", "firebase.json",
    "google-services.json", "package.json", "tsconfig.json", ".firebaserc",
    ".npmrc", "metro.config.js", "vitest.config.ts", "vitest.rules.config.ts",
}
ROOT_DOC_FILES = {"CLAUDE.md", "README.md"}

def classify(n):
    fp = n["filePath"]
    t = n["type"]

    if fp.startswith("functions/"):
        return "layer:functions"
    if fp.startswith("android/"):
        return "layer:infrastructure"
    if fp.startswith("scripts/"):
        return "layer:infrastructure"
    if fp.startswith("docs/"):
        return "layer:documentation"
    if fp.startswith(".agents/"):
        return "layer:documentation" if t == "document" else "layer:infrastructure"
    if fp.startswith(".github/"):
        return "layer:documentation"
    if fp.startswith(".claude/"):
        return "layer:infrastructure"
    if fp.startswith(".ua/"):
        return "layer:infrastructure"
    if fp.startswith("firestore-tests/"):
        return "layer:infrastructure"
    if fp == "firestore.rules":
        return "layer:data"
    if fp in ROOT_DOC_FILES:
        return "layer:documentation"
    if fp in ROOT_INFRA_FILES:
        return "layer:infrastructure"

    if fp.startswith("src/screens/"):
        return "layer:ui"
    if fp.startswith("src/navigation/"):
        return "layer:ui"
    if fp.startswith("src/shared/components/"):
        return "layer:ui"
    if fp.startswith("src/shared/ui/"):
        return "layer:ui"
    if fp.startswith("src/shared/styles/"):
        return "layer:ui"
    if fp.startswith("src/modules/"):
        return "layer:ui"
    if fp.startswith("src/components/"):
        return "layer:ui"

    if fp.startswith("src/stores/"):
        return "layer:state"
    if fp.startswith("src/context/"):
        return "layer:state"

    if fp.startswith("src/services/"):
        return "layer:service"
    if fp.startswith("src/shared/services/"):
        return "layer:service"
    if fp.startswith("src/repositories/"):
        return "layer:service"

    if fp.startswith("src/dm/"):
        return "layer:dm-domain"

    if fp.startswith("src/domain/"):
        return "layer:domain"
    if fp.startswith("src/types/"):
        return "layer:domain"

    if fp.startswith("src/data/"):
        return "layer:data"
    if fp.startswith("src/shared/const/"):
        return "layer:data"

    if fp.startswith("src/i18n/"):
        return "layer:utility"
    if fp.startswith("src/shared/helpers/"):
        return "layer:utility"

    if fp.startswith("src/test/"):
        return "layer:infrastructure"
    if fp.startswith("src/shared/mock/"):
        return "layer:infrastructure"

    return None

layers = {}
unmatched = []
for n in fn:
    layer_id = classify(n)
    if layer_id is None:
        unmatched.append(n)
        continue
    layers.setdefault(layer_id, []).append(n["id"])

print("Unmatched count:", len(unmatched))
for n in unmatched:
    print(" -", n["id"], "|", n["type"], "|", n["filePath"])

print()
total = 0
for k, v in sorted(layers.items()):
    print(k, len(v))
    total += len(v)
print("TOTAL:", total, "vs input", len(fn))

json.dump(layers, open(f"{UA_DIR}/tmp/ua-arch-layer-assignment.json", "w"), indent=2)
