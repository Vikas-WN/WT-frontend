import glob
import re

files = glob.glob('src/components/dashboard/**/*PageClient.tsx', recursive=True) + glob.glob('src/components/dashboard/profile/ProfilePageLeanClient.tsx', recursive=True)
files.append('src/components/dashboard/ui/profile.tsx')

for filepath in files:
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception:
        continue
    
    modified = False
    
    # 1. Imports
    if 'import { SkillsMultiSelectField }' in content:
        content = re.sub(
            r'import \{ SkillsMultiSelectField \} from "@/components/dashboard/ui/SkillsMultiSelectField";',
            'import { SkillRatingsListInput } from "@/components/dashboard/ui/SkillRatingsListInput";',
            content
        )
        modified = True

    # 2. State initialization
    if 'primary_skills: "",' in content:
        content = re.sub(
            r'primary_skills: "",\s*secondary_skill: "",\s*secondary_rating: "[^"]*",',
            'primary_skills: [],\n    secondary_skills: [],',
            content
        )
        modified = True

    # 3. JSX replacement
    jsx_pattern = r'<SkillsMultiSelectField[\s\S]*?</SkillsMultiSelectField>|<SkillsMultiSelectField[\s\S]*?/>'
    
    if re.search(jsx_pattern, content):
        content = re.sub(jsx_pattern, '<SkillRatingsListInput label="Primary Skills" value={selfProfileForm.primary_skills} onChange={(v) => setSelfProfileForm((prev) => ({ ...prev, primary_skills: v }))} />', content)
        modified = True

    jsx_pattern_2 = r'<InputField[\s\S]*?label="Secondary Skill"[\s\S]*?/>\s*<SelectField[\s\S]*?label="Secondary Skill Rating"[\s\S]*?/>'
    if re.search(jsx_pattern_2, content):
        content = re.sub(jsx_pattern_2, '<SkillRatingsListInput label="Secondary Skills" value={selfProfileForm.secondary_skills} onChange={(v) => setSelfProfileForm((prev) => ({ ...prev, secondary_skills: v }))} />', content)
        modified = True

    # 4. Payload replacement for the submission handler
    # We replace:
    # const primarySkills = selfProfileForm.primary_skills
    #  .split(",")
    #  .map((item) => item.trim())
    #  .filter(Boolean);
    payload_pattern = r'const primarySkills = selfProfileForm\.primary_skills\s*\.split\([^)]+\)\s*\.map\([^)]+\)\s*\.filter\(Boolean\);'
    if re.search(payload_pattern, content):
        content = re.sub(payload_pattern, 'const primarySkills = selfProfileForm.primary_skills;', content)
        modified = True

    payload_pattern_2 = r'const secondarySkill = selfProfileForm\.secondary_skill\.trim\(\);\s*const secondary_skills = secondarySkill\s*\?\s*\[\{ skill: secondarySkill, rating: Number\(selfProfileForm\.secondary_rating\) \}\]\s*:\s*\[\];'
    if re.search(payload_pattern_2, content):
        content = re.sub(payload_pattern_2, 'const secondary_skills = selfProfileForm.secondary_skills;', content)
        modified = True
        
    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
