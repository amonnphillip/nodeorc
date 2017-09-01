export class MyModule {
    private _value: number;
  constructor() {
    this._value = 0;
  }
  get value(): number {
      return this._value;
  }
  add(value: number) {
      this._value += value;
  }
}
