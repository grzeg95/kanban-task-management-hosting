export enum BreakpointsDevices {
  phone = 'phone',
  tablet = 'tablet',
  desktop = 'desktop'
}

export const BreakpointsMin = {
  [BreakpointsDevices.phone]: 0,
  [BreakpointsDevices.tablet]: 768,
  [BreakpointsDevices.desktop]: 1440,
};

export const Breakpoints = {
  [BreakpointsDevices.phone]: {
    selector: `(min-width: 0) and (max-width: ${BreakpointsMin.tablet - 1}px)`,
  },
  [BreakpointsDevices.tablet]: {
    selector: `(min-width: ${BreakpointsMin.tablet}px) and (max-width: ${BreakpointsMin.desktop - 1}px)`,
  },
  [BreakpointsDevices.desktop]: {
    selector: `(min-width: ${BreakpointsMin.desktop}px)`
  }
};
