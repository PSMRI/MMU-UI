import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { ZardButtonComponent } from '@/components/ui/button';
import { ZardDialogComponent } from '@/components/ui/dialog/dialog.component';

export const ZardDialogImports = [ZardButtonComponent, ZardDialogComponent, OverlayModule, PortalModule] as const;
