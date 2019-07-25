import get from 'lodash.get'

function selectionPlugin () {
  const plugin = {}
  let overlay
  let overlayContext
  let chartInstance
  let parentElement

  let state = {
    position: [],
    startIndex: -1,
    width: 0
  }

  const setState = (nextState) => {
    state = {
      ...state,
      ...nextState
    }
  }

  const getState = () => state

  const clear = () => {
    overlayContext.clearRect(0, 0, overlay.width, overlay.height)
  }

  const getChartElementIndex = (evt) => {
    const elems = chartInstance.getElementsAtXAxis(evt)
    if (!elems.length) {
      return -1
    }
    const index = get(elems, [0, '_index'], null)
    return index
  }

  const onMouseDown = (evt) => {
    clear()
    const index = getChartElementIndex(evt)
    if (index < 0) return
    const rect = overlay.getBoundingClientRect()
    const { clientX, clientY } = evt
    const x = clientX - rect.left
    const y = clientY - rect.top
    setState({ position: [x, y], startIndex: index })
  }

  const onMouseUp = (evt) => {
    const { startIndex } = getState()

    if (startIndex < 0) {
      return
    }
  
    const endIndex = getChartElementIndex(evt)

    setState({
      startIndex: -1
    })

    if (endIndex === startIndex) {
      return
    }

    clear()
    if (
      plugin.onMouseUp && typeof plugin.onMouseUp === 'function'
    ) {
      const left = startIndex < endIndex ? startIndex : endIndex
      const right = startIndex < endIndex ? endIndex : startIndex
      const labels = chartInstance.data.labels
      plugin.onMouseUp(evt, {
        startIndex: left,
        endIndex: right,
        startLabel: labels[left],
        endLabel: labels[right]
      })
    }
  }

  function drawOverlay (evt) {
    clear()
    const { clientX } = evt
    const { position } = getState()
    const [x, y] = position
    const rect = overlay.getBoundingClientRect()
    const width = Math.floor(clientX - rect.left - x)
    const chartArea = chartInstance.chartArea
    setState({
      width: width
    })
    overlayContext.fillRect(
      x, chartArea.top, width, chartArea.bottom - chartArea.top
    )
  }

  const onMouseMove = (evt) => {
    const { startIndex } = getState()
    if (startIndex > -1) {
      drawOverlay(evt)
    }
  }

  plugin.afterInit = (chart, options) => {
    chartInstance = chart
    parentElement = chart.canvas.parentElement
    overlay = document.createElement('canvas')
    overlay.style.background = 'transparent'
    overlay.style.position = 'absolute'
    overlay.style.cursor = 'crosshair'
    overlay.style.zIndex = 2
    overlay.style.opacity = 0.2
    overlay.style.pointerEvents = 'none'
    overlay.style.top = 0
    overlay.style.left = 0
    overlay.style.width = `${chart.canvas.offsetWidth}px`
    overlay.style.height = `${chart.canvas.offsetHeight}px`
    overlay.width = chart.canvas.offsetWidth
    overlay.height = chart.canvas.offsetHeight
    parentElement.appendChild(overlay)
    chart.canvas.onmousedown = onMouseDown
    chart.canvas.onmousemove = onMouseMove
    window.addEventListener('mouseup', onMouseUp)
    overlayContext = overlay.getContext('2d')
  }

  plugin.destroy = (chart, options) => {
    if (parentElement) {
      parentElement.removeChild(overlay)
    }
    window.removeEventListener('mouseup', onMouseUp)
  }

  return plugin
}

export default selectionPlugin
