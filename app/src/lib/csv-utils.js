const csvStringToArray = strData => {
  const objPattern = new RegExp(
    '(\\,|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^\\,\\r\\n]*))',
    'gi'
  )
  let arrMatches = null
  const arrData = [[]]
  while ((arrMatches = objPattern.exec(strData))) {
    if (arrMatches[1].length && arrMatches[1] !== ',') arrData.push([])
    arrData[arrData.length - 1].push(
      arrMatches[2]
        ? arrMatches[2].replace(new RegExp('""', 'g'), '"')
        : arrMatches[3]
    )
  }
  return arrData
    .map(arr => arr.map(strElement => strElement.trim()))
    .filter(arr => arr.length && arr[0].length)
}

export default csvStringToArray
