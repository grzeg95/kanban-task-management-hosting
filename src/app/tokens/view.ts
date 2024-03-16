import {InjectionToken} from '@angular/core';

export const UnauthorizedView = new InjectionToken<string>('UnauthorizedView');
export const AvailableUserViews = new InjectionToken<string[]>('AvailableUserViews');
export const DefaultUserView = new InjectionToken<string>('DefaultUserView');
