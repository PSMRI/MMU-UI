import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsNotificationComponent } from './sms-notification.component';

describe('SmsNotificationComponent', () => {
  let component: SmsNotificationComponent;
  let fixture: ComponentFixture<SmsNotificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SmsNotificationComponent],
    });
    fixture = TestBed.createComponent(SmsNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
