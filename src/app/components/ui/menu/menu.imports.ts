import { ZardContextMenuDirective } from '@/components/ui/menu/context-menu.directive';
import { ZardMenuContentDirective } from '@/components/ui/menu/menu-content.directive';
import { ZardMenuItemDirective } from '@/components/ui/menu/menu-item.directive';
import { ZardMenuLabelComponent } from '@/components/ui/menu/menu-label.component';
import { ZardMenuShortcutComponent } from '@/components/ui/menu/menu-shortcut.component';
import { ZardMenuDirective } from '@/components/ui/menu/menu.directive';

export const ZardMenuImports = [
  ZardContextMenuDirective,
  ZardMenuContentDirective,
  ZardMenuItemDirective,
  ZardMenuDirective,
  ZardMenuLabelComponent,
  ZardMenuShortcutComponent,
] as const;
