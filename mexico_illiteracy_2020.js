 // Data retrieval
 let mxURL = 'https://raw.githubusercontent.com/Traze3/Mexico_illiteracy/main/mx_topojson.json'
 let illitURL = 'https://raw.githubusercontent.com/Traze3/Mexico_illiteracy/main/analfabetismo.csv'

 // We set the projection to be centered in Mexico and create a path variable to be used in the map creation
 var projection = d3.geoMercator()
     .scale(1700)
     .center([-102,25.5])
 
 var path = d3.geoPath().projection(projection)

 // Number format to be used in data display
 var numFor = Intl.NumberFormat('es-MX')

 // Our function that will be called once the data has been succesfully loaded
 let drawMap = () =>{

     /* In the following part, the maximum and minimum values of the csv are extracted to be used in the domain of our
     color scale function in order to color de states dinamically and based on the entire dataset.*/

     var maxData = d3.max(illitData, (d) =>{
                             return d.Porcentaje_analfabetismo
                         })
     var minData = d3.min(illitData, (d) =>{
         return d.Porcentaje_analfabetismo
     })
     var colorScale = d3.scaleLinear()
                     .domain([minData,maxData])
                     .range(['white','red'])
                     .interpolate(d3.interpolateRgb)
     
     // We set a threshold to display the legend in order to display 5 different colors and make it data responsive
     var threshold = d3.scaleThreshold()
                     .domain([0, Math.round(100*maxData/4)/100,
                     Math.round(100*2*(maxData/4))/100, Math.round(100*3*(maxData/4))/100,
                     Math.round(100*maxData)/100])
                     .range(['white','red'])
     
     /* We create two empty arrays in order to store the threshold value and the corresponding color, to be
     used in the legend */
     var color_array = []
     var label_array = []
     threshold.domain().forEach((d, i)=>{
         console.log(d + ' ' + colorScale(d))
         label_array.push(Math.round(d*100)+'%')
         color_array.push(colorScale(d))
     })

     /* We create the svg for the legend and append g, as well as the attributes we wish to use, such as the 
     threshold values and colors. We have used Susie Lu's amazing work: https://d3-legend.susielu.com/*/
     var svgLegend = d3.select('#legend')

     svgLegend.append('g')
         .attr('class','legendLinear')
         .attr('transform','translate(20,30)')
     
     var legendLinear = d3.legendColor()
         .labels(label_array)
         .labelFormat(d3.format('.0f'))
         .title('Illiteracy status of people 15 and over')
         .shapeWidth(110)
         .cells([threshold.domain()[0],threshold.domain()[1],threshold.domain()[2],threshold.domain()[3],
         threshold.domain()[4]])
         .orient('horizontal')
         .scale(colorScale)

     svgLegend.select('.legendLinear')
             .call(legendLinear)
     
     // We create a containter to house the div of our tooltip and give it desired attributes
     var svgContainer = d3.select('#viz')

     var svg = svgContainer.append('svg')
         .attr('id','viz')
     
     var tooltip = d3.select('body')
         .append('div')
         .attr('class','tooltip')
         .style("opacity", 0)
         .style("background-color", "black")
         .style("border", "solid")
         .style("border-width", "2px")
         .style("border-radius", "5px")
         .style("padding", "5px")

     /* We create the map and apply the previously defined path as well as the fill using the colorScale to color it
     based on the data*/
     svg.selectAll('path')
         .data(mxData)
         .enter()
         .append('path')
         .attr('d',path)
         .attr('class','county')
         .attr('stroke','black')
         .attr('fill', (mxDataItem)=>{
             /* We look for the state name in the json and look for the same name in the csv, in order to extract the
             percentage column value to apply a colorScale to it and color states based on its value*/
             let mx_name = mxDataItem.properties.state_name
             let state = illitData.find((item) =>{
                 return item['Entidad federativa'] === mx_name
             })
             let percentage = state['Analfabeta'] / state['Total']
             return colorScale(percentage)
         })
         .on('mouseover', (event, d) =>{
             tooltip.style('opacity',1)
         }) 
         .on('mousemove', (event, d) =>{
             /* We do the same process when coloring the states, but now we present the data using a html tooltip
             element that gets the mouse location through the d3.pointer. We also use the number formatting used before*/
             const[x,y] = d3.pointer(event)
             let mx_name = d.properties.state_name
             let state = illitData.find((item) =>{
                 return item['Entidad federativa'] === mx_name
         })
             let percentage = state['Analfabeta'] / state['Total']
             tooltip.html(state['Entidad federativa'] + '<br>' + '% of illiteracy: ' + 
                 Math.round(percentage*10000)/100  + '%' + '<br>' + 'Literate: ' + numFor.format(state['Alfabeta']) + 
                 '<br>' + 'Illiterate: ' + numFor.format(state['Analfabeta']) + '<br>' + 'Not specified: ' + 
                 numFor.format(state['No especificado']))
                 .style('left', (event.clientX)  + 'px')
                 .style('top', (event.clientY) -80 + 'px')
         })
         .on('mouseout', (event, d) =>{
             const[x,y] = d3.pointer(event)
             tooltip.transition()
                 .duration(200)
                 .delay(100)
             tooltip.style('opacity',0)
         })
     
     }

/* This is the data loading part, where the data is passed to the console if succesful, or if not, an error is passed to the
console as well. The drawMap function is called if everything is ok*/
 d3.json(mxURL).then((data,error)=>{
         if(error){
             console.log(log)
         }else{
             mxData = data
             mxData = topojson.feature(mxData, mxData.objects.states).features;
             console.log('MX Data');
             console.log(mxData);

             d3.csv(illitURL).then((data,error) => {
                     if(error){
                         console.log(error)
                     }else{
                         illitData = data;
                         console.log('Illiteracy data');
                         console.log(illitData);
                         drawMap();
                     }
                 }
             )
         }
     }
 )