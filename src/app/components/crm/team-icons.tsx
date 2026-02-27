/**
 * Team Icons — shared catalogue of Phosphor icons for team customisation.
 *
 * Import `TEAM_ICONS` for the full list and `getTeamIconComponent(name)`
 * to resolve an icon name string into its React component.
 */

import {
  UsersThree,
  Megaphone,
  Headset,
  ChartLineUp,
  Handshake,
  Gear,
  Briefcase,
  Buildings,
  ShoppingCart,
  Rocket,
  Lightning,
  Target,
  Flag,
  Heart,
  Star,
  Trophy,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Code,
  PaintBrush,
  Camera,
  VideoCamera,
  Microphone,
  Globe,
  ChatCircle,
  Envelope,
  Phone,
  MapPin,
  Truck,
  Package,
  Wrench,
  Shield,
  Lock,
  Key,
  Bell,
  Calendar,
  ClockCountdown,
  Fire,
  Sparkle,
  Diamond,
  Coins,
  Bank,
  Receipt,
  Notepad,
  FileText,
  FolderOpen,
  TreeStructure,
  Compass,
  Binoculars,
  Siren,
  FirstAidKit,
  Scales,
  Atom,
  GameController,
  Cube,
  // ── Additional icons ──
  Airplane,
  Anchor,
  BoundingBox,
  Browser,
  Bug,
  Calculator,
  ChartPie,
  CloudArrowUp,
  Coffee,
  Crosshair,
  Crown,
  Database,
  Desktop,
  Fingerprint,
  Flask,
  Gift,
  Hammer,
  Heartbeat,
  HouseLine,
  Leaf,
  Link,
  MagicWand,
  Palette,
  PaperPlaneTilt,
  PencilSimple,
  Plug,
  Polygon,
  PresentationChart,
  PuzzlePiece,
  Robot,
  Ruler,
  Storefront,
  Strategy,
  Sunglasses,
  Tag,
  ThumbsUp,
  Translate,
  UserCircle,
  Waveform,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

/* ================================================================== */
/*  Catalogue                                                          */
/* ================================================================== */

export interface TeamIconEntry {
  value: string;
  label: string;
  Icon: PhosphorIcon;
}

export const TEAM_ICONS: TeamIconEntry[] = [
  // ── People & Teams ──
  { value: "UsersThree", label: "Equipe", Icon: UsersThree },
  { value: "UserCircle", label: "Perfil", Icon: UserCircle },
  { value: "Crown", label: "Lideranca", Icon: Crown },
  { value: "Handshake", label: "Parcerias", Icon: Handshake },

  // ── Business & Sales ──
  { value: "Briefcase", label: "Negocios", Icon: Briefcase },
  { value: "Buildings", label: "Empresa", Icon: Buildings },
  { value: "Storefront", label: "Loja", Icon: Storefront },
  { value: "ShoppingCart", label: "E-commerce", Icon: ShoppingCart },
  { value: "ChartLineUp", label: "Vendas", Icon: ChartLineUp },
  { value: "ChartPie", label: "Analytics", Icon: ChartPie },
  { value: "PresentationChart", label: "Apresentacao", Icon: PresentationChart },
  { value: "Target", label: "Metas", Icon: Target },
  { value: "Crosshair", label: "Foco", Icon: Crosshair },
  { value: "Strategy", label: "Estrategia", Icon: Strategy },

  // ── Marketing & Communication ──
  { value: "Megaphone", label: "Marketing", Icon: Megaphone },
  { value: "ChatCircle", label: "Atendimento", Icon: ChatCircle },
  { value: "Envelope", label: "Email", Icon: Envelope },
  { value: "PaperPlaneTilt", label: "Envio", Icon: PaperPlaneTilt },
  { value: "Phone", label: "Telefonia", Icon: Phone },
  { value: "Globe", label: "Internacional", Icon: Globe },
  { value: "Translate", label: "Traducao", Icon: Translate },
  { value: "Tag", label: "Tags", Icon: Tag },
  { value: "ThumbsUp", label: "Aprovacao", Icon: ThumbsUp },

  // ── Support & CS ──
  { value: "Headset", label: "Suporte", Icon: Headset },
  { value: "Heart", label: "CS/Sucesso", Icon: Heart },
  { value: "Heartbeat", label: "Monitoramento", Icon: Heartbeat },
  { value: "FirstAidKit", label: "Saude", Icon: FirstAidKit },
  { value: "Siren", label: "Alerta", Icon: Siren },

  // ── Tech & Engineering ──
  { value: "Code", label: "Tecnologia", Icon: Code },
  { value: "Bug", label: "QA/Bugs", Icon: Bug },
  { value: "Database", label: "Dados", Icon: Database },
  { value: "Desktop", label: "Desktop", Icon: Desktop },
  { value: "Browser", label: "Web", Icon: Browser },
  { value: "Robot", label: "Automacao", Icon: Robot },
  { value: "Plug", label: "Integracoes", Icon: Plug },
  { value: "CloudArrowUp", label: "Cloud", Icon: CloudArrowUp },
  { value: "Gear", label: "Config", Icon: Gear },
  { value: "Wrench", label: "Operacoes", Icon: Wrench },
  { value: "Hammer", label: "Build", Icon: Hammer },
  { value: "Cube", label: "Modulos", Icon: Cube },

  // ── Creative & Design ──
  { value: "PaintBrush", label: "Design", Icon: PaintBrush },
  { value: "Palette", label: "Cores", Icon: Palette },
  { value: "PencilSimple", label: "Edicao", Icon: PencilSimple },
  { value: "Camera", label: "Foto", Icon: Camera },
  { value: "VideoCamera", label: "Video", Icon: VideoCamera },
  { value: "Microphone", label: "Podcast", Icon: Microphone },
  { value: "Waveform", label: "Audio", Icon: Waveform },
  { value: "MagicWand", label: "Criativo", Icon: MagicWand },
  { value: "BoundingBox", label: "UI/UX", Icon: BoundingBox },
  { value: "Ruler", label: "Medidas", Icon: Ruler },
  { value: "Polygon", label: "3D/Motion", Icon: Polygon },

  // ── Finance & Legal ──
  { value: "Coins", label: "Financeiro", Icon: Coins },
  { value: "Bank", label: "Banco", Icon: Bank },
  { value: "Receipt", label: "Fiscal", Icon: Receipt },
  { value: "Calculator", label: "Contabilidade", Icon: Calculator },
  { value: "Scales", label: "Juridico", Icon: Scales },

  // ── Education & Knowledge ──
  { value: "BookOpen", label: "Conteudo", Icon: BookOpen },
  { value: "GraduationCap", label: "Educacao", Icon: GraduationCap },
  { value: "Lightbulb", label: "Inovacao", Icon: Lightbulb },
  { value: "Flask", label: "Laboratorio", Icon: Flask },
  { value: "Atom", label: "Ciencia", Icon: Atom },
  { value: "PuzzlePiece", label: "Solucoes", Icon: PuzzlePiece },

  // ── Documents & Organization ──
  { value: "Notepad", label: "Notas", Icon: Notepad },
  { value: "FileText", label: "Documentos", Icon: FileText },
  { value: "FolderOpen", label: "Arquivos", Icon: FolderOpen },
  { value: "TreeStructure", label: "Estrutura", Icon: TreeStructure },
  { value: "Link", label: "Links", Icon: Link },

  // ── Logistics & Location ──
  { value: "MapPin", label: "Localizacao", Icon: MapPin },
  { value: "Truck", label: "Logistica", Icon: Truck },
  { value: "Package", label: "Produtos", Icon: Package },
  { value: "Airplane", label: "Viagens", Icon: Airplane },
  { value: "Anchor", label: "Porto", Icon: Anchor },
  { value: "HouseLine", label: "Imoveis", Icon: HouseLine },
  { value: "Compass", label: "Direcao", Icon: Compass },
  { value: "Binoculars", label: "Pesquisa", Icon: Binoculars },

  // ── Special & Fun ──
  { value: "Rocket", label: "Lancamento", Icon: Rocket },
  { value: "Lightning", label: "Performance", Icon: Lightning },
  { value: "Fire", label: "Trending", Icon: Fire },
  { value: "Sparkle", label: "Destaque", Icon: Sparkle },
  { value: "Star", label: "Premium", Icon: Star },
  { value: "Trophy", label: "Conquistas", Icon: Trophy },
  { value: "Diamond", label: "VIP", Icon: Diamond },
  { value: "Gift", label: "Presentes", Icon: Gift },
  { value: "Coffee", label: "Cafe", Icon: Coffee },
  { value: "Sunglasses", label: "Cool", Icon: Sunglasses },
  { value: "Leaf", label: "Sustentavel", Icon: Leaf },
  { value: "GameController", label: "Games", Icon: GameController },

  // ── Security & Access ──
  { value: "Shield", label: "Seguranca", Icon: Shield },
  { value: "Lock", label: "Compliance", Icon: Lock },
  { value: "Key", label: "Acesso", Icon: Key },
  { value: "Fingerprint", label: "Biometria", Icon: Fingerprint },

  // ── Time & Notifications ──
  { value: "Bell", label: "Notificacoes", Icon: Bell },
  { value: "Calendar", label: "Agenda", Icon: Calendar },
  { value: "ClockCountdown", label: "Urgente", Icon: ClockCountdown },
  { value: "Flag", label: "Projetos", Icon: Flag },
];

/* ================================================================== */
/*  Resolver                                                           */
/* ================================================================== */

const _iconMap = new Map<string, PhosphorIcon>(
  TEAM_ICONS.map((i) => [i.value, i.Icon])
);

/**
 * Resolve an icon name to its Phosphor component.
 * Falls back to UsersThree if name is missing or not in catalogue.
 */
export function getTeamIconComponent(iconName?: string | null): PhosphorIcon {
  if (!iconName) return UsersThree;
  return _iconMap.get(iconName) ?? UsersThree;
}