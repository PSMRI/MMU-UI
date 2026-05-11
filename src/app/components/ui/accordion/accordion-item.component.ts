import { ChangeDetectionStrategy, Component, computed, input, signal, ViewEncapsulation, booleanAttribute } from '@angular/core';
import type { ClassValue } from 'clsx';
import { ZardAccordionComponent } from '@/components/ui/accordion/accordion.component';
import { accordionItemVariants } from '@/components/ui/accordion/accordion.variants';
import { mergeClasses } from '@/lib/utils/merge-classes';

@Component({
  selector: 'z-accordion-item',
  standalone: true,
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'itemClasses()',
    '[attr.data-state]': "isOpen() ? 'open' : 'closed'",
  },
  exportAs: 'zAccordionItem',
})
export class ZardAccordionItemComponent {
  readonly zTitle = input<string>('');
  readonly zValue = input<string>('');
  readonly expanded = input(false, { transform: booleanAttribute });
  readonly class = input<ClassValue>('');

  accordion!: ZardAccordionComponent;
  readonly isOpen = signal(false);

  protected readonly itemClasses = computed(() => mergeClasses(accordionItemVariants(), this.class()));

  constructor() {
    // We will set isOpen based on expanded input in ngAfterContentInit or using an effect
  }

  toggle(): void {
    if (this.accordion) {
      this.accordion.toggleItem(this);
    } else {
      this.isOpen.update(v => !v);
    }
  }
}
