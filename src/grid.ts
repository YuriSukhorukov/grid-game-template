import { Container, ContainerChild, Graphics } from 'pixi.js'

export enum UserEventType {
  MOVE_UP,
  MOVE_DOWN,
  MOVE_LEFT,
  MOVE_RIGHT,
  DESTROY_ITEM,
}

export interface IUserEvent<T extends UserEventType> {
  delta: number
  step: number
  index?: number
  userEventType: T
}

export class Grid {
  container: Container
  tiles: Array<Graphics>
  rows: number
  columns: number
  selectedIndex: number
  tileSize: number
  selectedRow: number
  selectedColumn: number
  selector: Graphics

  currentEventMove: IUserEvent<UserEventType> | null
  moveEventsQueue: Array<IUserEvent<UserEventType>>
  destroyEventsQueue: Array<IUserEvent<UserEventType.DESTROY_ITEM>>

  destroyMap: { [key: number]: number | null }

  constructor(
    parent: Container<ContainerChild>,
    canvas: HTMLCanvasElement,
    rows: number,
    columns: number,
    tileSize: number
  ) {
    this.container = new Container({
      parent,
      position: { x: canvas.width / 2, y: canvas.height / 2 },
    })
    this.tiles = []
    this.rows = rows
    this.columns = columns
    this.selectedIndex = 0
    this.tileSize = tileSize
    this.selectedRow = 0
    this.selectedColumn = 0
    this.currentEventMove = null

    this.moveEventsQueue = []
    this.destroyEventsQueue = []

    this.destroyMap = {}

    this.container.x -= tileSize * (columns / 2)
    this.container.y -= tileSize * (rows / 2)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        const tile = new Graphics()
          .rect(j * tileSize, i * tileSize, tileSize, tileSize)
          .fill(0xffff00)
          .stroke({ width: 2, color: 0x000000 })
        this.tiles.push(tile)
        this.container.addChild(tile)
      }
    }

    this.selector = new Graphics({ parent: this.container })
      .rect(-this.tileSize, 0, tileSize, tileSize)
      .stroke({ width: 8, color: 0x000000 })

    this.container.children[rows * columns].x += tileSize

    this.select(1, 1)
  }

  select(column: number, row: number) {
    this.selectedColumn = column > this.columns ? 0 : column
    this.selectedRow = row > this.rows ? 0 : row
  }

  updateMoveEventsQueue(deltaTime: number) {
    if (this.moveEventsQueue.length > 0 && !this.currentEventMove) {
      this.currentEventMove = this.moveEventsQueue.shift() ?? null
    }
    if (!this.currentEventMove) return

    if (
      (this.rows === 1 &&
        (this.currentEventMove.userEventType === UserEventType.MOVE_UP ||
          this.currentEventMove.userEventType === UserEventType.MOVE_DOWN)) ||
      (this.columns === 1 &&
        (this.currentEventMove.userEventType === UserEventType.MOVE_LEFT ||
          this.currentEventMove.userEventType === UserEventType.MOVE_RIGHT))
    )
      return

    this.currentEventMove.delta -= this.currentEventMove.step * deltaTime
    const multiplier =
      this.currentEventMove.userEventType === UserEventType.MOVE_DOWN ||
      this.currentEventMove.userEventType === UserEventType.MOVE_RIGHT
        ? 1
        : -1
    const key =
      this.currentEventMove.userEventType === UserEventType.MOVE_UP ||
      this.currentEventMove.userEventType === UserEventType.MOVE_DOWN
        ? 'y'
        : 'x'

    this.selector[key] += this.currentEventMove.step * deltaTime * multiplier
    if (this.currentEventMove.delta < 0) {
      this.selector[key] += this.currentEventMove.delta * multiplier
      this.currentEventMove = null
    }
  }

  get selectedIndex1D() {
    return (this.selectedRow - 1) * this.columns + (this.selectedColumn - 1)
  }

  pushDestroyUserEvent<T extends UserEventType>(userEvent: IUserEvent<T>) {
    if (
      userEvent.userEventType === UserEventType.DESTROY_ITEM &&
      userEvent.index !== undefined
    ) {
      if (this.destroyMap[userEvent.index] !== undefined) return
      this.destroyMap[userEvent.index] = userEvent.index

      this.destroyEventsQueue.push({
        ...userEvent,
        userEventType: UserEventType.DESTROY_ITEM,
      })
    }
  }

  updateDestroyEventsQueue(deltaTime: number) {
    if (!this.destroyEventsQueue?.length) return
    for (let i = 0; i < this.destroyEventsQueue.length; i++) {
      const eventDestroy = this.destroyEventsQueue[i]
      if (eventDestroy?.index === undefined) continue
      const item = this.tiles[eventDestroy.index]

      if (eventDestroy.delta > 0) {
        eventDestroy.delta -= eventDestroy.step * deltaTime
        item.alpha = eventDestroy.delta
      }
    }
  }

  update(deltaTime: number) {
    this.updateMoveEventsQueue(deltaTime)
    this.updateDestroyEventsQueue(deltaTime)
  }
}
