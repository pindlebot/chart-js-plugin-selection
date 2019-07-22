import get from 'lodash.get'

export default (callback) => {
  let overlay
  let overlayContext
  let chartInstance
  let parentElement

  let state = {
    position: [],
    trailingEdge: null,
    width: 0
  }

  const cache = {}
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

  const getLeadingEdge = (evt) => {
    const elems = chartInstance.getElementsAtXAxis(evt)
    if (!elems.length) {
      return -1
    }
    const label = get(elems, [0, '_view', 'label'], null)
    const index = get(elems, [0, '_index'], null)
    return index
  }

  const onMouseDown = (evt) => {
    clear()
    const index = getLeadingEdge(evt)
    if (index < 0) return
    const rect = overlay.getBoundingClientRect()
    const { clientX, clientY } = evt
    const x = clientX - rect.left
    const y = clientY - rect.top
    setState({ position: [x, y], trailingEdge: { index } })
  }

  const onMouseUp = (evt) => {
    const { trailingEdge } = getState()
    if (!trailingEdge) return
    const leadingEdge = getLeadingEdge(evt)
    setState({
      trailingEdge: null
    })

    if (leadingEdge === trailingEdge) {
      return
    }

    clear()
    Object.values(cache).forEach(({ index, datasetIndex, color, key }) => {
      chartInstance.data.datasets[datasetIndex].backgroundColor[index] = color
    })
    chartInstance.update()
    callback(evt, { leadingEdge, trailingEdge })
  }

  function drawOverlay (evt) {
    clear()
    const { clientX } = evt
    const state = getState()
    const [x] = state.position
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

  function getElements (evt) {
    return chartInstance.getElementsAtXAxis(evt)
      .map(elem => ({
        key: `${elem._datasetIndex}-${elem._index}`,
        index: elem._index,
        datasetIndex: elem._datasetIndex,
        color: elem._model.backgroundColor
      }))
  }

  function setCache (elem) {
    if (cache[elem.key]) {
      return
    }
    cache[elem.key] = elem
  }

  function modifyColorInPlace (datasetIndex, trailingEdge, leadingEdge) {
    return function (color, index) {
      const key = `${datasetIndex}-${index}`
      const elem = cache[key]
      const isBackward = trailingEdge.index > leadingEdge.index

      if (
        index >= (isBackward ? leadingEdge.index : trailingEdge.index) &&
        index <= (isBackward ? trailingEdge.index : leadingEdge.index)
      ) {
        this[index] = '#7CF261'
        return
      }

      if (elem) {
        this[index] = elem.color
      }
    }
  }

  const onMouseMove = (evt) => {
    const { clientX } = evt
    const { trailingEdge } = getState()
    if (trailingEdge) {
      drawOverlay(evt)
      const elems = getElements(evt)

      elems.forEach(setCache)

      if (elems.length) {
        const leadingEdge = { index: elems[0].index }
        chartInstance.data.datasets.forEach((dataset, index) => {
          dataset.backgroundColor.forEach(
            modifyColorInPlace(index, trailingEdge, leadingEdge),
            dataset.backgroundColor
          )
        })
      }

      chartInstance.update()
    }
  }

  const plugin = {
    afterInit: (chart, options) => {
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
      chart.canvas.onmouseup = onMouseUp
      chart.canvas.onmousemove = onMouseMove
      overlayContext = overlay.getContext('2d')
    },
    destroy: (chart, options) => {
      if (parentElement) {
        parentElement.removeChild(overlay)
      }
    }
  }

  return plugin
}
