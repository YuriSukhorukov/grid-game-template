import { Application } from 'pixi.js'
import { Grid, UserEventType } from './grid'

// Example url with params http://localhost:5173/?rows=7&columns=9

const DEWFAULT_ROWS = '7'
const DEFAULT_COLUMNS = '9'
const MOVE_SPEED = 10
const TELEPORT_SPEED = 50
const FADE_SPEED = 0.075

export async function setupGame(body: HTMLBodyElement) {
  let params = new URLSearchParams(document.location.search)
  const ROWS = parseInt(params.get('rows') ?? DEWFAULT_ROWS)
  const COLUMNS = parseInt(params.get('columns') ?? DEFAULT_COLUMNS)

  const app = new Application()
  await app.init({
    resizeTo: body,
    backgroundColor: 0xffffff,
  })

  body.appendChild(app.canvas)
  body.addEventListener('keydown', onKeyDown)

  const { width, height } = app.canvas

  const aspectRatioWindow = height < width ? height / width : width / height
  const rows = ROWS
  const columns = COLUMNS
  const spacing = 1
  const largeSize = Math.min(width, height)
  const largeAmount = Math.max(columns, rows)
  const defaultTileSize = largeSize / (largeAmount + spacing * 2)
  const aspectRatio =
    largeAmount * defaultTileSize > largeSize
      ? largeSize / (largeAmount * defaultTileSize)
      : 1
  const tileSize =
    aspectRatio == 1
      ? defaultTileSize * aspectRatio
      : defaultTileSize * aspectRatio * aspectRatioWindow

  const grid = new Grid(app.stage, app.canvas, rows, columns, tileSize)

  app.ticker.add((delta) => {
    grid.update(delta.deltaTime)
  })

  grid.select(1, 1)

  function onKeyDown(key: KeyboardEvent) {
    if (key.code === 'Enter') {
      grid.pushDestroyUserEvent({
        userEventType: UserEventType.DESTROY_ITEM,
        index: grid.selectedIndex1D,
        step: FADE_SPEED,
        delta: 1,
      })
    }

    if (key.code === 'ArrowUp' || key.code === 'KeyW') {
      if (grid.selectedRow - 1 < 1) {
        grid.moveEventsQueue.push({
          delta: Math.abs(grid.rows * grid.tileSize - grid.tileSize),
          step: TELEPORT_SPEED,
          userEventType: UserEventType.MOVE_DOWN,
        })

        grid.select(grid.selectedColumn, grid.rows)
      } else {
        grid.moveEventsQueue.push({
          step: MOVE_SPEED,
          delta: Math.abs(
            grid.selectedRow * grid.tileSize -
              (grid.selectedRow + 1) * grid.tileSize
          ),
          userEventType: UserEventType.MOVE_UP,
        })
        grid.select(grid.selectedColumn, grid.selectedRow - 1)
      }
    }
    if (key.code === 'ArrowDown' || key.code === 'KeyS') {
      if (grid.selectedRow + 1 > grid.rows) {
        grid.moveEventsQueue.push({
          step: TELEPORT_SPEED,
          delta: Math.abs(grid.rows * grid.tileSize - grid.tileSize),
          userEventType: UserEventType.MOVE_UP,
        })
        grid.select(grid.selectedColumn, 1)
      } else {
        grid.moveEventsQueue.push({
          step: MOVE_SPEED,
          delta: Math.abs(
            grid.selectedRow * grid.tileSize -
              (grid.selectedRow - 1) * grid.tileSize
          ),
          userEventType: UserEventType.MOVE_DOWN,
        })
        grid.select(grid.selectedColumn, grid.selectedRow + 1)
      }
    }
    if (key.code === 'ArrowLeft' || key.code === 'KeyA') {
      if (grid.selectedColumn - 1 < 1) {
        grid.moveEventsQueue.push({
          step: TELEPORT_SPEED,
          delta: Math.abs(grid.columns * grid.tileSize - grid.tileSize),
          userEventType: UserEventType.MOVE_RIGHT,
        })
        grid.select(grid.columns, grid.selectedRow)
      } else {
        grid.moveEventsQueue.push({
          step: MOVE_SPEED,
          delta: Math.abs(
            grid.selectedColumn * grid.tileSize -
              (grid.selectedColumn + 1) * grid.tileSize
          ),
          userEventType: UserEventType.MOVE_LEFT,
        })
        grid.select(grid.selectedColumn - 1, grid.selectedRow)
      }
    }
    if (key.code === 'ArrowRight' || key.code === 'KeyD') {
      if (grid.selectedColumn + 1 > grid.columns) {
        grid.moveEventsQueue.push({
          step: TELEPORT_SPEED,
          delta: Math.abs(grid.columns * grid.tileSize - grid.tileSize),
          userEventType: UserEventType.MOVE_LEFT,
        })
        grid.select(1, grid.selectedRow)
      } else {
        grid.moveEventsQueue.push({
          step: MOVE_SPEED,
          delta: Math.abs(
            grid.selectedColumn * grid.tileSize -
              (grid.selectedColumn - 1) * grid.tileSize
          ),
          userEventType: UserEventType.MOVE_RIGHT,
        })
        grid.select(grid.selectedColumn + 1, grid.selectedRow)
      }
    }
  }
}
