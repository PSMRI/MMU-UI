import { ZardAccordionContentComponent } from '@/components/ui/accordion/accordion-content.component';
import { ZardAccordionItemComponent } from '@/components/ui/accordion/accordion-item.component';
import { ZardAccordionTriggerComponent } from '@/components/ui/accordion/accordion-trigger.component';
import { ZardAccordionComponent } from '@/components/ui/accordion/accordion.component';

export const ZardAccordionImports = [
  ZardAccordionComponent,
  ZardAccordionItemComponent,
  ZardAccordionTriggerComponent,
  ZardAccordionContentComponent,
] as const;
