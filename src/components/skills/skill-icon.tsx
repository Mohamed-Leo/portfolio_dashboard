import {
  ImageIcon,
  VideoIcon,
  PenLineIcon,
  BotIcon,
  ShieldCheckIcon,
  BracesIcon,
  DatabaseIcon,
  NetworkIcon,
  PlugIcon,
  CodeIcon,
  PaletteIcon,
  WorkflowIcon,
  MonitorIcon,
  ServerIcon,
} from 'lucide-react';
import type { Skill } from '@/lib/validations/skillSchema';

const capabilityIcons = {
  image: ImageIcon,
  video: VideoIcon,
  content: PenLineIcon,
  context: BotIcon,
  review: ShieldCheckIcon,
  api: BracesIcon,
  data: DatabaseIcon,
  architecture: NetworkIcon,
  tools: PlugIcon,
  ide: CodeIcon,
};
const groupIcons = {
  frontend: MonitorIcon,
  backend: ServerIcon,
  creative: PaletteIcon,
  workflow: WorkflowIcon,
};
const brandAssets = import.meta.glob<string>('/src/assets/skills/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function SkillIcon({
  skill,
  className = 'size-5',
}: {
  skill: Skill;
  className?: string;
}) {
  const asset = brandAssets['/src/assets/skills/' + skill.id + '.svg'];
  const Icon = skill.capability
    ? capabilityIcons[skill.capability]
    : groupIcons[skill.groupId];
  return !skill.capability && asset ? (
    <img src={asset} alt="" className={className + ' object-contain'} />
  ) : (
    <Icon className={className} aria-hidden="true" />
  );
}
