import { Price } from "./price";
import { IBase } from "../iBase";
import { UNITS } from "../data/units";
import { Unit } from "../units/unit";

describe("Price", () => {
  let spendable: IBase = new Unit(UNITS[0]);
  beforeEach(() => {
    spendable = new Unit(UNITS[0]);
  });
  it("should create an instance", () => {
    expect(new Price(spendable, new Decimal(1))).toBeTruthy();
  });
  it("reload cannot buy", () => {
    spendable.quantity = new Decimal(0);
    const price = new Price(spendable, new Decimal(10), 1.1);
    price.reload(new Decimal(0));

    expect(price.canBuy).toBeFalsy();
    expect(price.maxBuy.toNumber()).toBe(0);
  });
  it("reload cannot buy 2", () => {
    spendable.quantity = new Decimal(0);
    const price = new Price(spendable, new Decimal(10), 1.1);
    price.reload(new Decimal(0));

    expect(price.canBuy).toBeFalsy();
    expect(price.maxBuy.toNumber()).toBe(0);
  });
  it("reload can buy", () => {
    spendable.quantity = new Decimal(15);
    const price = new Price(spendable, new Decimal(10), 1.1);
    price.reload(new Decimal(1));

    expect(price.canBuy).toBeTruthy();
    expect(price.maxBuy.toNumber()).toBe(1);
  });
  it("reload can buy 2", () => {
    spendable.quantity = new Decimal(35);
    const price = new Price(spendable, new Decimal(10), 1.1);
    price.reload(new Decimal(2));

    expect(price.canBuy).toBeTruthy();
    expect(price.maxBuy.toNumber()).toBe(2);
  });
  it("buy", () => {
    spendable.quantity = new Decimal(35);
    const price = new Price(spendable, new Decimal(10), 1.1);
    price.reload(new Decimal(1));
    const ret = price.buy(new Decimal(2), new Decimal(1));
    price.reload(new Decimal(1));

    expect(ret).toBeTruthy();
    expect(price.canBuy).toBeTruthy();
    expect(price.maxBuy.toNumber()).toBe(1);
    expect(Math.floor(price.spendable.quantity.toNumber())).toBe(11);
  });
});
