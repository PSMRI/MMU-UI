import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, computed } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { ZardAccordionItemComponent } from './accordion-item.component';
import { accordionTriggerVariants } from './accordion.variants';
import { mergeClasses } from '@/lib/utils/merge-classes';

@Component({
  selector: 'z-accordion-trigger',
  standalone: true,
  imports: [NgIcon],
  template: `
    <button
      type="button"
      [attr.aria-controls]="'content-' + item.zValue()"
      [attr.aria-expanded]="item.isOpen()"
      [id]="'accordion-' + item.zValue()"
      [class]="classes()"
      (click)="item.toggle()"
    >
      <ng-content></ng-content>
      <ng-icon
        name="lucideChevronDown"
        class="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"
        [class]="item.isOpen() ? 'rotate-180' : ''"
      ></ng-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideChevronDown })],
})
export class ZardAccordionTriggerComponent {
  protected item = inject(ZardAccordionItemComponent);
  protected readonly classes = computed(() => mergeClasses(accordionTriggerVariants()));
}
