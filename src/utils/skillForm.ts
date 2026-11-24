import type { Skill, SkillFormValues, SkillInput, SkillUpdate } from '@/lib/validations/skillSchema';

export function skillFormDefaults(skill?: Skill): SkillFormValues {
  return {
    id: skill?.id ?? '', name: skill?.name ?? '', description: skill?.description ?? '',
    groupId: skill?.groupId ?? 'frontend', level: skill?.level ?? 'core',
    capability: skill?.capability ?? 'none', sortOrder: skill?.sortOrder ?? 0,
  };
}

export function skillFormPayload(values: SkillFormValues): SkillInput {
  return { ...values, capability: values.capability === 'none' ? null : values.capability };
}

export function skillFormPatch(values: SkillFormValues, original: Skill): SkillUpdate {
  const previous = new Map(Object.entries(skillFormPayload(skillFormDefaults(original))));
  return Object.fromEntries(Object.entries(skillFormPayload(values)).filter(([key, value]) => key !== 'id' && value !== previous.get(key)));
}
