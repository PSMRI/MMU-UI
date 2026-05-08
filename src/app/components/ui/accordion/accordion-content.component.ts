import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, computed } from '@angular/core';
import { ZardAccordionItemComponent } from './accordion-item.component';
import { accordionContentVariants } from './accordion.variants';
import { mergeClasses } from '@/lib/utils/merge-classes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'z-accordion-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      role="region"
      [attr.aria-labelledby]="'accordion-' + item.zValue()"
      [attr.data-state]="item.isOpen() ? 'open' : 'closed'"
      [id]="'content-' + item.zValue()"
      [class]="classes()"
    >
      <div class="overflow-hidden">
        <div class="pt-0 pb-4">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ZardAccordionContentComponent {
  protected item = inject(ZardAccordionItemComponent);
  protected readonly classes = computed(() => mergeClasses(accordionContentVariants({ isOpen: this.item.isOpen() })));
}
