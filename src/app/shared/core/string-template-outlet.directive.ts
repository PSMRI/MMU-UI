import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';

@Directive({
  selector: '[zStringTemplateOutlet]',
  standalone: true,
})
export class ZardStringTemplateOutletDirective {
  private viewContainer = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef);

  @Input()
  set zStringTemplateOutlet(value: string | TemplateRef<any> | null | undefined) {
    this.viewContainer.clear();
    if (value instanceof TemplateRef) {
      this.viewContainer.createEmbeddedView(value);
    } else {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
