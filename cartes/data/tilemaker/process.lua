node_keys = { "place", "name" }
way_keys = { "highway", "building", "landuse", "natural", "waterway", "name" }

function node_function()
  local place = Find("place")
  if place ~= "" then
    Layer("places", false)
    Attribute("class", place)
    Attribute("name", Find("name"))
  end
end

function way_function()
  local highway = Find("highway")
  if highway ~= "" then
    Layer("roads", false)
    Attribute("class", highway)
  end

  local building = Find("building")
  if building ~= "" then
    Layer("buildings", true)
    Attribute("class", building)
  end

  local landuse = Find("landuse")
  local natural = Find("natural")
  if landuse ~= "" or natural ~= "" then
    Layer("landuse", true)
    Attribute("class", landuse ~= "" and landuse or natural)
  end

  local waterway = Find("waterway")
  if waterway ~= "" then
    Layer("waterway", false)
    Attribute("class", waterway)
  end

  if natural == "water" or landuse == "reservoir" then
    Layer("water", true)
    Attribute("class", "water")
  end
end
