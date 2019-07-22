function clamp (value, min = 0, max = 1) {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

export function hexToRgb (color) {
  color = color.substr(1)

  const re = new RegExp(`.{1,${color.length / 3}}`, 'g')
  let colors = color.match(re)

  if (colors && colors[0].length === 1) {
    colors = colors.map(n => n + n)
  }

  return colors ? `rgb(${colors.map(n => parseInt(n, 16)).join(', ')})` : ''
}

export function decomposeColor (color) {
  // Idempotent
  if (color.type) {
    return color
  }

  if (color.charAt(0) === '#') {
    return decomposeColor(hexToRgb(color))
  }

  const marker = color.indexOf('(')
  const type = color.substring(0, marker)

  let values = color.substring(marker + 1, color.length - 1).split(',')
  values = values.map(value => parseFloat(value))

  return { type, values }
}

export function recomposeColor (color) {
  const { type } = color
  let { values } = color

  if (type.indexOf('rgb') !== -1) {
    // Only convert the first 3 values to int (i.e. not alpha)
    values = values.map((n, i) => (i < 3 ? parseInt(n, 10) : n));
  } else if (type.indexOf('hsl') !== -1) {
    values[1] = `${values[1]}%`
    values[2] = `${values[2]}%`
  }

  return `${type}(${values.join(', ')})`
}

export function darken (color, coefficient) {
  color = decomposeColor(color)
  coefficient = clamp(coefficient)

  if (color.type.indexOf('hsl') !== -1) {
    color.values[2] *= 1 - coefficient
  } else if (color.type.indexOf('rgb') !== -1) {
    for (let i = 0; i < 3; i += 1) {
      color.values[i] *= 1 - coefficient
    }
  }
  return recomposeColor(color)
}

export function lighten (color, coefficient) {
  color = decomposeColor(color)
  coefficient = clamp(coefficient)

  if (color.type.indexOf('hsl') !== -1) {
    color.values[2] += (100 - color.values[2]) * coefficient
  } else if (color.type.indexOf('rgb') !== -1) {
    for (let i = 0; i < 3; i += 1) {
      color.values[i] += (255 - color.values[i]) * coefficient
    }
  }

  return recomposeColor(color)
}
