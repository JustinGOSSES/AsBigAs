# AsBigAs
A javascript library that returns comparisons for length, height, area, volume, and weight.

Or maybe use python & fastAPI?

## Idea
There are separate JSONs for Length, height, area, hardness, and weight. Each is an array that contains objects that contain "name_of_thing", "measurement", "unit", "type_of_thing", and "source".

"type_of_thing" can be:
- person
- animal
- plant
- automobile
- plane
- planet
- city

"measurement" for "length" or "height" JSON can be:
- "foot"
- "inch"
- "mile"
- "nautical_mile"
- "league"
- "nanometer"
- "milimeter"
- "centimeter"
- "meter"
- "kilometer"
- "light-year"

"measurement" for "area" JSON can be one of the above in unit^2

"measurement" for "volumne" JSON can be one of the above in unit^3


"measurement" for "weight" JSON can be:
- to-do
- to-do
- to-do
- to-do

## API Use
The idea behind this API is it would be used to find funny or relatable ways to describe the physical properties of something. 

It could be used in an Observable notebook to explore analogies. 

For example: 
- "The interior of the van has the same volumne as 1523 average pineapples."

It could also be used to add an interactive element to any web based text content or data visualizations. The end user could iterate through random selections of analogies to represent a physical measurement. 


## API calls

get_measurement:
- "measurement_type":enum string
- "measurement_unit":enum string
- "measurement_value:float
- "output_unit":string (optional)
- "output_type_of_thing_category":enum string (optional)
- "random_or_ordered_results":enum string "random" or "ordered"

output:
all inputs +
- "type_of_thing":string
- "analogy_thing_name":string
- "analogy_number_of_things:float

## API tasks
- Download JSON appropriate for measurement_type
- filter by "output_type_of_thing_category" if present in API call
- select random value or first value in list based on "random_or_ordered_results"
- return outputs in JSON.

## Documentation needs to make useful
- code documentation
- getting started tutorial
- example webpages
- example uses in WordPress
- example in Observable

## Examples of silly units of measurement in wild
- Asteroid in size of giraff https://twitter.com/mailonline/status/1503400626008596487?s=21
