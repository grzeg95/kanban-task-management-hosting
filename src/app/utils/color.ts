import {map} from './map';

export class Color {

  constructor(
    private r = 0,
    private g = 0,
    private b = 0
  ) {
  }

  toRgbString() {
    return `rgb(${this.r},${this.g},${this.b})`;
  }

  static hexStringColorToColor(hexStringColor: string) {

    if (!/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(hexStringColor)) {
      return new Color(0,0,0);
    }

    const color = hexStringColor.split('#').at(-1)!.match(/.{2}/gm)!.map((hex) => parseInt(hex, 16));

    return new Color(color[0], color[1], color[2]);
  }

  static shift(from: Color, to: Color, shift: number) {

    const r = map(shift, 0, 1, from.r, to.r);
    const g = map(shift, 0, 1, from.g, to.g);
    const b = map(shift, 0, 1, from.b, to.b);

    return new Color(r, g, b);
  }
}
