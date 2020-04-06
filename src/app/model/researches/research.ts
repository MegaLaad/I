import { IResearchData } from "../data/iResearchData";
import { Job, MyIcon } from "../job/job";
import { convertToRoman, solveEquation } from "ant-utils";
import {
  RESEARCH_GROW_RATE,
  ZERO,
  INFINITY,
  RESEARCH_BASE_PRICE,
  RESEARCH_LEVEL_MULTI
} from "../CONSTANTS";
import { IUnlockable } from "../iUnlocable";
import { Game } from "../game";
import { IBase } from "../iBase";
import { ResearchManager } from "./researchManager";
import { Unit } from "../units/unit";
import { Bonus } from "../bonus/bonus";

export class Research extends Job implements IUnlockable, IBase {
  static lastVisId = 0;
  id: string;
  visId = 0;
  visLevel = 0;
  private originalName: string;
  max = 1;
  unitsToUnlock?: IUnlockable[];
  researchToUnlock?: Research[];
  technologiesToUnlock?: IUnlockable[];
  spaceStationsToUp?: { spaceStation: Unit; habSpace: Decimal }[];
  quantity: Decimal;
  icon?: string;
  resData: IResearchData;
  navalCapacity = 0;
  available = false;
  constructor(researchData: IResearchData, researchManager: ResearchManager) {
    super();
    this.resData = researchData;
    this.id = researchData.id;
    this.name = researchData.name;
    this.originalName = this.name;
    this.description = researchData.description;
    this.initialPrice = new Decimal(researchData.price);
    this.visId = Research.lastVisId++;

    const rs = Game.getGame().resourceManager;
    if ("max" in researchData) {
      this.max = researchData.max;
    } else {
      this.max = 10;
    }
    this.growRate = RESEARCH_GROW_RATE;
    if ("growRate" in researchData) {
      this.growRate = researchData.growRate;
    }
    if ("unitsToUnlock" in researchData) {
      this.unitsToUnlock = researchData.unitsToUnlock.map((uId) =>
        rs.units.find((a) => a.id === uId)
      );
    }
    if ("technologiesToUnlock" in researchData) {
      this.technologiesToUnlock = researchData.technologiesToUnlock.map(
        (techId) => researchManager.technologies.find((a) => a.id === techId)
      );
    }
    if ("navalCapacity" in researchData) {
      this.navalCapacity = this.resData.navalCapacity;
    }
    if ("stationToUp" in researchData) {
      researchData.stationToUp.forEach((stu) => {
        const station = rs.units.find((u) => u.id === stu.stationId);
        station.habSpaceStack.bonuses.push(
          new Bonus(this, new Decimal(stu.habSpace))
        );
      });
    }
    this.types = researchData.type.map((t) =>
      researchManager.technologies.find((tec) => tec.id === t.id)
    );
    this.reload();
  }
  reload(): void {
    super.reload();
    this.name =
      this.originalName +
      (this.level > 1
        ? " " + convertToRoman(Decimal.min(this.level, this.max))
        : "");
    this.quantity = new Decimal(this.level);
  }
  reloadUi() {
    super.reloadUi();
    const newTotalBonUi = this.totalBonus.minus(1).times(100);
    if (!newTotalBonUi.eq(this.totalBonusUi)) this.totalBonusUi = newTotalBonUi;

    this.timeToEnd = solveEquation(
      ZERO,
      ZERO,
      Game.getGame().researchManager.researchPerSec,
      this.total.minus(this.progress).times(-1).div(this.totalBonus)
    )
      .reduce((p, c) => p.min(c), INFINITY)
      .toNumber();
  }
  onCompleted(force = false): void {
    super.onCompleted();

    if (this.level < 2 || force) {
      const game = Game.getGame();
      if (this.unitsToUnlock) {
        this.unitsToUnlock.forEach((u) => u.unlock());
        game.resourceManager.reloadLists();
      }
      if (this.researchToUnlock) {
        this.researchToUnlock.forEach((u) => u.unlock());
      }
      if (this.technologiesToUnlock) {
        this.technologiesToUnlock.forEach((tech) => tech.unlock());
      }
      game.navalCapacity += this.navalCapacity;
    }
  }
  unlock(): boolean {
    const resM = Game.getGame().researchManager;
    return resM.unlock(this);
  }
  getIcons(): MyIcon[] {
    return this.types.map((t) => {
      return {
        icon: t.icon,
        color: t.color
      };
    });
  }
  setLevels() {
    if (this.researchToUnlock) {
      this.researchToUnlock.forEach((res) => {
        res.visLevel = this.visLevel + 1;
        this.initialPrice = new Decimal(RESEARCH_BASE_PRICE).times(
          Decimal.pow(RESEARCH_LEVEL_MULTI, res.visLevel - 1)
        );
        res.setLevels();
      });
    }
  }
  setAvailability() {
    if (this.researchToUnlock && this.level > 0) {
      this.researchToUnlock.forEach((res) => {
        res.available = true;
        res.setAvailability();
      });
    }
  }
  //#region Save and Load
  getSave(): any {
    const ret: any = {};
    ret.i = this.id;
    if (this.progress.gt(0)) {
      ret.p = this.progress;
    }
    if (this.level > 0) {
      ret.l = this.level;
    }
    return ret;
  }
  load(data: any) {
    if (!("i" in data) || data.i !== this.id) return false;
    if ("p" in data) this.progress = new Decimal(data.p);
    if ("l" in data) this.level = data.l;
    this.reload();
  }
  //#endregion
}
