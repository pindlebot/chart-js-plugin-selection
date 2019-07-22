import React from 'react'
import { render } from 'react-dom'
import { Bar } from 'react-chartjs-2'
import createPlugin from '../src/plugin'

function onClick (evt, data) {
  console.log({ evt, data })
}

const plugin = createPlugin(onClick)

const genColors = (len, color) => {
  return new Array(len).fill(color)
}

render(
  <div
    style={{
      width: 400,
      height: 300,
      position: 'relative'
    }}
  >
    <Bar
      width={400}
      height={300}
      style={{
        width: 400,
        height: 300
      }}
      plugins={[
        plugin
      ]}
      data={{
        labels: ['1', '2', '3', '4', '5'],
        datasets: [{
          backgroundColor: ['#C84630', '#D4A0A7', '#E3E3E3', '#898989', '#5DA271'],
          data: [1, 2, 3, 4, 5]
        }]
      }}
    />
  </div>,
  document.getElementById('root')
)
