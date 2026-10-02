(function () {
      'use strict';
      var NS = 'http://www.w3.org/2000/svg';
      var surface = document.getElementById('inicio');
      if (!surface) return;
      var svg = document.getElementById('hero-plan');
      var group = document.getElementById('hero-plane-lines');
      var surfaceGroup = document.getElementById('hero-volume-surfaces');
      var edgeGroup = document.getElementById('hero-volume-edges');
      var labelGroup = document.getElementById('hero-zone-labels');
      var root = surface;
      var stage = document.getElementById('hero-animation-stage');
      var pop = document.getElementById('hero-map-pop');
      var picture = document.getElementById('hero-map-img');
      var cursor = document.getElementById('hero-map-cur');
      var ring = document.getElementById('hero-map-ring');
      var pictures = { hab: 'assets/hero-bedroom.webp', liv: 'assets/hero-living.webp' };

      // Una sola línea central por pared, según las nuevas referencias.
      // Las prolongaciones eliminadas quedan fuera del contorno.
      var wallPaths = [
        [[54,1019],[54,35],[683,35],[683,1019],[54,1019]],
        [[54,244],[683,244]],
        [[250,244],[250,1019]],
        [[650,244],[650,985]],
        [[451,35],[451,169]],
        [[451,216],[451,244]],
        [[451,216],[477,177]],
        [[250,280],[453,280]],
        [[453,244],[453,409]],
        [[419,280],[419,409],[453,409]],
        [[419,371],[453,371]],
        [[293,280],[293,317],[250,317]],
        [[250,368],[291,368],[291,405],[250,405]],
        [[509,244],[509,278]],
        [[555,325],[509,325],[509,410],[650,410]],
        [[609,325],[650,325]],
        [[509,461],[509,498],[650,498]],
        [[453,499],[453,680]],
        [[250,605],[453,605]],
        [[650,680],[509,680],[509,769]],
        [[561,769],[650,769]],
        [[453,769],[453,837],[405,915]],
        [[54,891],[348,891],[405,915],[494,985]],
        [[250,985],[650,985]]
      ];
      // Los sectores usan el contorno del plano aprobado. Los cierres de los
      // volúmenes se dibujan arriba: no agregan paredes a la planta original.
      var sectors = [
        { id: 'hab', points: [[451,35],[683,35],[683,244],[451,244]] },
        { id: 'coc', points: [[250,280],[453,280],[453,409],[250,409]] },
        { id: 'com', points: [[250,409],[453,409],[453,605],[250,605]] },
        { id: 'liv', points: [[250,605],[453,605],[453,837],[405,915],[348,891],[250,891]] },
        { id: 'aux1', points: [[509,244],[650,244],[650,325],[509,325]] },
        { id: 'aux2', points: [[509,325],[650,325],[650,410],[509,410]] },
        { id: 'aux3', points: [[509,410],[650,410],[650,498],[509,498]] },
        { id: 'aux4', points: [[453,499],[509,499],[509,498],[650,498],[650,680],[453,680]] },
        { id: 'aux5', points: [[509,680],[650,680],[650,769],[509,769]] },
        { id: 'aux6', points: [[453,769],[650,769],[650,985],[494,985],[405,915],[453,837]] }
      ];
      var zones = [
        { id: 'patio', label: 'PATIO', at: [152,560], raised: false, enter: { delay: 75, duration: 160, from: [-2,0] } },
        { id: 'hab', label: 'HABITACIÓN', raised: true, enter: { delay: 0, duration: 175, from: [0,2] } },
        { id: 'coc', label: 'COCINA', raised: true, enter: { delay: 160, duration: 150, from: [2,0] } },
        { id: 'com', label: 'COMEDOR', raised: true, enter: { delay: 230, duration: 185, from: [0,-2] } },
        { id: 'liv', label: 'LIVING', raised: true, enter: { delay: 310, duration: 165, from: [0,2] } }
      ];

      // La geometría procede de la vista superior. La cámara mantiene todos
      // los vértices en el mismo plano durante el giro y el desplazamiento.
      var view = [
        -.5503981520, -6.3892209537, 1657.8950657163,
        -1.1428100825, -.9970529476, 823.4159477962,
        -.0041219103, -.0035653082, 1.5804528748
      ];
      function apply(matrix, p) {
        var w = matrix[6] * p[0] + matrix[7] * p[1] + matrix[8];
        return [
          (matrix[0] * p[0] + matrix[1] * p[1] + matrix[2]) / w,
          (matrix[3] * p[0] + matrix[4] * p[1] + matrix[5]) / w
        ];
      }
      function clamp(t) { return Math.max(0, Math.min(1, t)); }
      function ease(t) { return t * t * (3 - 2 * t); }
      function mix(a, b, t) { return a + (b - a) * t; }
      function distance(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
      function floorPoint(p) { return [(p[0] - 54) * 100 / 629, (p[1] - 35) * 100 / 629]; }
      function centerOf(points) {
        var area = 0, x = 0, y = 0;
        points.forEach(function (a, i) {
          var b = points[(i + 1) % points.length], weight = a[0] * b[1] - b[0] * a[1];
          area += weight;
          x += (a[0] + b[0]) * weight;
          y += (a[1] + b[1]) * weight;
        });
        return [x / (3 * area), y / (3 * area)];
      }
      sectors.forEach(function (sector) {
        sector.floorPoints = sector.points.map(floorPoint);
        sector.center = centerOf(sector.floorPoints);
      });
      function element(name, className, parent) {
        var node = document.createElementNS(NS, name);
        node.setAttribute('class', className);
        parent.appendChild(node);
        return node;
      }
      function subtract(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
      function pointKey(p) { return p[0].toFixed(5) + ',' + p[1].toFixed(5); }
      function segmentKey(a, b) { return [pointKey(a), pointKey(b)].sort().join('|'); }

      var records = [], totalLength = 0;
      wallPaths.forEach(function (points) {
        var floor = points.map(floorPoint);
        var line = document.createElementNS(NS, 'path');
        line.setAttribute('class', 'plan-line');
        line.setAttribute('pathLength', '1');
        group.appendChild(line);
        var length = 0;
        for (var i = 1; i < floor.length; i++) length += distance(floor[i - 1], floor[i]);
        records.push({ element: line, points: floor, start: totalLength, length: length });
        totalLength += length;
      });

      // Cada sector es un bloque completo. Las paredes del plano no se extruyen.
      var cubeRecords = [], cubeEdgeRecords = [], cubePostRecords = [];
      var edgeKeys = Object.create(null), postKeys = Object.create(null);
      sectors.forEach(function (sector, index) {
        var node = element('g', 'cube', surfaceGroup);
        var cube = { sector: sector, index: index, points: sector.floorPoints, element: node,
          top: element('path', 'cube-top', node), sides: [], elevation: 0, progress: 0 };
        node.setAttribute('data-area', sector.id);
        sector.floorPoints.forEach(function (point, i, points) {
          var next = points[(i + 1) % points.length];
          cube.sides.push({ element: element('path', 'cube-side', node), points: [point, next] });
          var edgeKey = segmentKey(point, next);
          if (!edgeKeys[edgeKey]) {
            var edge = { element: element('path', 'cube-edge', edgeGroup), points: [point, next], cubes: [] };
            edgeKeys[edgeKey] = edge;
            cubeEdgeRecords.push(edge);
          }
          edgeKeys[edgeKey].cubes.push(cube);
          var postKey = pointKey(point);
          if (!postKeys[postKey]) {
            var post = { element: element('path', 'cube-edge', edgeGroup), point: point, cubes: [] };
            postKeys[postKey] = post;
            cubePostRecords.push(post);
          }
          postKeys[postKey].cubes.push(cube);
        });
        node.addEventListener('mouseenter', function () { setHover(sector.id); });
        node.addEventListener('mouseleave', function () { if (hoveredSector === sector.id) setHover(null); });
        cubeRecords.push(cube);
      });
      var labelRecords = zones.map(function (zone) {
        var node = element('g', 'zone-label', labelGroup);
        var leader = element('path', 'zone-leader', node);
        var box = element('rect', '', node), text = element('text', '', node);
        box.setAttribute('rx', '2.5');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = zone.label;
        node.addEventListener('mouseenter', function () { setHover(zone.id); });
        node.addEventListener('mouseleave', function () { if (hoveredSector === zone.id) setHover(null); });
        var sector = sectors.find(function (item) { return item.id === zone.id; });
        return { element: node, leader: leader, box: box, text: text,
          point: sector ? sector.center.slice() : floorPoint(zone.at), raised: zone.raised,
          enter: zone.enter, label: zone.label, id: zone.id, position: [0,0] };
      });

      function getBounds(points) {
        var xs = points.map(function (p) { return p[0]; });
        var ys = points.map(function (p) { return p[1]; });
        var left = Math.min.apply(null, xs), right = Math.max.apply(null, xs);
        var top = Math.min.apply(null, ys), bottom = Math.max.apply(null, ys);
        return { width: right - left, height: bottom - top, x: (left + right) / 2, y: (top + bottom) / 2 };
      }
      var vertices = [];
      records.forEach(function (record) { vertices = vertices.concat(record.points); });
      var floorBounds = getBounds(vertices);
      var normalizer = view[6] * floorBounds.x + view[7] * floorBounds.y + view[8];
      view = view.map(function (value) { return value / normalizer; });
      var projectedBounds = getBounds(vertices.map(function (point) { return apply(view, point); }));

      var width = 0, height = 0, elapsed = 0, frame = 0, started = 0;
      var drawDuration = 1300;
      var cubeStart = drawDuration + 120, cubeDuration = 650, baseCubeHeight = 6, sectorDelay = 35;
      var labelStart = cubeStart + cubeDuration + (sectors.length - 1) * sectorDelay + 100;
      var duration = labelStart + Math.max.apply(null, zones.map(function (zone) { return zone.enter.delay + zone.enter.duration; })) + 100;
      var destination = { left: 0, top: 0, width: 0, height: 0 };
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
      var focusRooms = sectors.filter(function (sector) { return sector.id === 'hab' || sector.id === 'liv'; });
      var focusHeight = 8, focusDepth = .22, perspective = .003;
      // Posiciones del observador marcadas en la referencia: el dormitorio
      // se mira desde la esquina exterior; el living desde su acceso diagonal.
      var roomEyes = { hab: floorPoint([678,44]), liv: floorPoint([386,883]) };
      var roomViews = {};
      focusRooms.forEach(function (room) {
        var near = subtract(roomEyes[room.id], room.center), length = Math.hypot(near[0], near[1]);
        roomViews[room.id] = { cos: near[1] / length, sin: near[0] / length };
      });
      var focus = { lift: Math.sqrt(1 - focusDepth * focusDepth), unit: 1, x: 0, y: 0 };
      var camera = { progress: 0, point: focusRooms[0].center, room: focusRooms[0] };
      var tour = null, tourRunning = false, traceProgress = 1, activeSector = null, hoveredSector = null, hearts = [];

      function projectPlane(point, tilt) {
        var mobile = width < 760;
        var topScale = Math.min(width * (mobile ? .64 : .36) / floorBounds.width, height * .60 / floorBounds.height);
        var topX = width * .5 + (point[0] - floorBounds.x) * topScale;
        var topY = height * .55 + (point[1] - floorBounds.y) * topScale;
        var scale = Math.min(destination.width * .88 / projectedBounds.width, destination.height * .64 / projectedBounds.height);
        var centerX = destination.left + destination.width * .5;
        var centerY = destination.top + destination.height * .48;
        var weight = view[6] * point[0] + view[7] * point[1] + view[8];
        var endX = (view[0] * point[0] + view[1] * point[1] + view[2] - projectedBounds.x * weight) * scale + centerX * weight;
        var endY = (view[3] * point[0] + view[4] * point[1] + view[5] - projectedBounds.y * weight) * scale + centerY * weight;
        // Giro, escala y desplazamiento comparten el mismo progreso.
        var denominator = mix(1, weight, tilt);
        return [mix(topX, endX, tilt) / denominator, mix(topY, endY, tilt) / denominator];
      }
      function focusWeight(point, room) {
        room = room || camera.room;
        var pose = roomViews[room.id], delta = subtract(point, room.center);
        return Math.max(.35, 1 - (delta[0] * pose.sin + delta[1] * pose.cos) * perspective);
      }
      function focusPoint(point, elevation, room) {
        room = room || camera.room;
        var pose = roomViews[room.id], delta = subtract(point, room.center), weight = focusWeight(point, room);
        return [(delta[0] * pose.cos - delta[1] * pose.sin) * focus.unit / weight,
          ((delta[0] * pose.sin + delta[1] * pose.cos) * focusDepth - elevation * focus.lift) * focus.unit / weight];
      }
      function selectedHeight(elevation) { return mix(elevation, focusHeight, camera.progress); }
      function lifted(point, tilt, elevation) {
        var q = projectPlane(point, tilt);
        var weight = view[6] * point[0] + view[7] * point[1] + view[8];
        var startWeight = mix(1, weight, tilt);
        q[1] -= elevation * destination.width * .0033 / startWeight;
        if (!camera.progress) return q;
        var end = focusPoint(point, elevation);
        var anchor = focusPoint(camera.point, selectedHeight(baseCubeHeight));
        var endWeight = focusWeight(point), denominator = mix(startWeight, endWeight, camera.progress);
        return [mix(q[0] * startWeight, (focus.x + end[0] - anchor[0]) * endWeight, camera.progress) / denominator,
          mix(q[1] * startWeight, (focus.y + end[1] - anchor[1]) * endWeight, camera.progress) / denominator];
      }
      function project(point, tilt) { return lifted(point, tilt, 0); }
      function measureFocus() {
        // La foto conserva su posición. El mapa se acerca desde el punto de
        // vista de cada render y puede continuar detrás del texto del hero.
        focus.x = destination.left + pop.offsetLeft + pop.offsetWidth * .5;
        focus.y = destination.top + pop.offsetTop + pop.offsetHeight - 16 * destination.width / 600;
        var margin = Math.max(12, width * .018);
        // En un teléfono bajo se baja el ángulo de vista, para conservar el
        // mapa grande y el volumen visible sin mover la foto sobre el texto.
        focusDepth = width < 760 ? Math.min(.22, Math.max(.08, (height - margin - focus.y) / destination.width * .5)) : .22;
        focus.lift = Math.sqrt(1 - focusDepth * focusDepth);
        focus.unit = 1;
        var points = [];
        focusRooms.forEach(function (room) {
          var anchor = focusPoint(room.center, focusHeight, room);
          room.floorPoints.forEach(function (point) {
            [0, focusHeight].forEach(function (z) {
              var q = focusPoint(point, z, room);
              points.push([q[0] - anchor[0], q[1] - anchor[1]]);
            });
          });
        });
        var bounds = getBounds(points);
        var left = bounds.x - bounds.width / 2, right = bounds.x + bounds.width / 2;
        var top = bounds.y - bounds.height / 2, bottom = bounds.y + bounds.height / 2;
        // El ambiente elegido y el extremo derecho quedan dentro del hero.
        // El resto del plano puede continuar detrás del texto.
        var limits = [destination.width * .015];
        if (left < 0) limits.push((focus.x - margin) / -left);
        if (right > 0) limits.push((width - margin - focus.x) / right);
        if (top < 0) limits.push((focus.y - 84) / -top);
        if (bottom > 0) limits.push((height - margin - focus.y) / bottom);
        var mapAnchor = focusPoint(camera.point, focusHeight);
        var mapRight = Math.max.apply(null, vertices.map(function (point) {
          return focusPoint(point, 0)[0] - mapAnchor[0];
        }));
        if (mapRight > 0) limits.push((width - margin - focus.x) / mapRight);
        focus.unit = Math.max(.01, Math.min.apply(null, limits));
      }
      function pathData(points, tilt, elevation, closed) {
        return points.map(function (point, i) {
          var q = lifted(point, tilt, elevation);
          return (i ? 'L' : 'M') + q[0].toFixed(2) + ' ' + q[1].toFixed(2);
        }).join('') + (closed ? 'Z' : '');
      }
      function cubeSideData(points, tilt, elevation) {
        var floorA = project(points[0], tilt), floorB = project(points[1], tilt);
        var topA = lifted(points[0], tilt, elevation), topB = lifted(points[1], tilt, elevation);
        return [floorA, floorB, topB, topA].map(function (point, i) {
          return (i ? 'L' : 'M') + point[0].toFixed(2) + ' ' + point[1].toFixed(2);
        }).join('') + 'Z';
      }

      function render(time) {
        var drawn = clamp(time / drawDuration) * traceProgress * totalLength;
        var tilt = 1;
        records.forEach(function (record) {
          var local = drawn >= totalLength ? 1 : clamp((drawn - record.start) / record.length);
          var path = record.points.map(function (point, i) {
            var q = project(point, tilt);
            return (i ? 'L' : 'M') + q[0].toFixed(2) + ' ' + q[1].toFixed(2);
          }).join('');
          record.element.setAttribute('d', path);
          record.element.style.strokeDashoffset = String(1 - local);
          record.element.style.opacity = local > 0 ? '.68' : '0';
        });
        cubeRecords.forEach(function (cube) {
          var progress = ease(clamp((time - cubeStart - cube.index * sectorDelay) / cubeDuration));
          var elevation = baseCubeHeight * progress;
          if (activeSector && cube.sector.id === activeSector.id) elevation = selectedHeight(elevation);
          cube.progress = progress;
          cube.elevation = elevation;
          cube.top.setAttribute('d', pathData(cube.points, tilt, elevation, true));
          cube.sides.forEach(function (side) { side.element.setAttribute('d', cubeSideData(side.points, tilt, elevation)); });
          cube.element.style.opacity = String(progress * traceProgress);
          cube.element.style.pointerEvents = progress > .1 && traceProgress > .5 ? 'all' : 'none';
          cube.element.classList.toggle('hot', !!activeSector && cube.sector.id === activeSector.id);
        });
        cubeEdgeRecords.forEach(function (record) {
          var heights = [], opacity = 0;
          record.cubes.forEach(function (cube) {
            if (heights.indexOf(cube.elevation) < 0) heights.push(cube.elevation);
            opacity = Math.max(opacity, cube.progress);
          });
          record.element.setAttribute('d', heights.map(function (z) { return pathData(record.points, tilt, z, false); }).join(''));
          record.element.style.opacity = String(.68 * opacity * traceProgress);
          record.element.classList.toggle('hot', !!activeSector && record.cubes.some(function (cube) { return cube.sector.id === activeSector.id; }));
        });
        cubePostRecords.forEach(function (record) {
          var elevation = 0, opacity = 0;
          record.cubes.forEach(function (cube) {
            elevation = Math.max(elevation, cube.elevation);
            opacity = Math.max(opacity, cube.progress);
          });
          var a = project(record.point, tilt), b = lifted(record.point, tilt, elevation);
          record.element.setAttribute('d', 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + 'L' + b[0].toFixed(2) + ' ' + b[1].toFixed(2));
          record.element.style.opacity = String(.55 * opacity * traceProgress);
          record.element.classList.toggle('hot', !!activeSector && record.cubes.some(function (cube) { return cube.sector.id === activeSector.id; }));
        });
        labelRecords.forEach(function (record) {
          var entry = record.enter;
          var progress = ease(clamp((time - labelStart - entry.delay) / entry.duration));
          // El redibujado también recupera las etiquetas con entradas separadas.
          var redrawProgress = ease(clamp(((traceProgress - .6) * 1400 - entry.delay) / entry.duration));
          var visibility = progress * redrawProgress;
          var fontSize = width < 760 ? 6.8 : 7.6, boxHeight = width < 760 ? 12 : 16;
          var boxWidth = record.label.length * fontSize * .78 + 14;
          // Centro del sector, apenas por encima del piso, sin seguir su techo.
          var q = lifted(record.point, tilt, record.raised ? .3 : 0);
          // Separación mínima en móvil para que Cocina y Comedor no se tapen.
          if (width < 760) q[1] += (record.id === 'coc' ? -3 : record.id === 'com' ? 3 : 0) * (1 - camera.progress);
          q[0] += entry.from[0] * (1 - visibility);
          q[1] += entry.from[1] * (1 - visibility);
          record.position = q;
          record.leader.style.opacity = '0';
          record.element.setAttribute('transform', 'translate(' + q[0].toFixed(2) + ' ' + q[1].toFixed(2) + ')');
          record.element.style.opacity = String(visibility);
          record.element.style.pointerEvents = visibility > .1 && (!activeSector || activeSector.id === record.id) ? 'all' : 'none';
          record.box.setAttribute('x', String(-boxWidth / 2));
          record.box.setAttribute('y', String(-boxHeight / 2));
          record.box.setAttribute('width', String(boxWidth));
          record.box.setAttribute('height', String(boxHeight));
          record.text.setAttribute('font-size', String(fontSize));
          record.text.setAttribute('y', String(fontSize * .35));
        });
        if (tourRunning) return;
        if (time >= duration) surface.setAttribute('data-hero-map-phase', 'complete');
        else if (time >= labelStart) surface.setAttribute('data-hero-map-phase', 'labels');
        else if (time >= cubeStart) surface.setAttribute('data-hero-map-phase', 'volumes');
      }
      function measure() {
        width = surface.clientWidth;
        height = surface.clientHeight;
        var heroBounds = surface.getBoundingClientRect();
        var bounds = stage.getBoundingClientRect();
        destination = { left: bounds.left - heroBounds.left, top: bounds.top - heroBounds.top, width: bounds.width, height: bounds.height };
        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        measureFocus();
        render(elapsed);
      }
      function tick(now) {
        elapsed = Math.min(duration, now - started);
        render(elapsed);
        if (elapsed < duration) frame = window.requestAnimationFrame(tick);
        else startTour();
      }
      function replay() {
        stopTour();
        window.cancelAnimationFrame(frame);
        root.classList.add('hero-map-reset');
        root.classList.toggle('hero-map-no-motion', reduce.matches);
        surface.setAttribute('data-hero-map-phase', 'drawing');
        // Dibujar desde cero en su posición final, antes de elevar los bloques.
        elapsed = reduce.matches ? duration : 0;
        started = performance.now() - elapsed;
        measure();
        void surface.getBoundingClientRect();
        root.classList.remove('hero-map-reset');
        if (!reduce.matches) frame = window.requestAnimationFrame(tick);
      }
      window.addEventListener('resize', measure);
      svg.addEventListener('dblclick', replay);
      reduce.addEventListener('change', replay);

      // Secuencia original: cursor, clic, foco, popup, doble clic con corazón,
      // cierre y vuelta a General. Habitación primero; Living después.
      function setHot(id, on) {
        labelRecords.forEach(function (record) { record.element.classList.toggle('hot', on && record.id === id); });
        activeSector = on ? sectors.find(function (sector) { return sector.id === id; }) : null;
        render(duration);
      }
      function setHover(id) {
        hoveredSector = id;
        labelRecords.forEach(function (record) { record.element.classList.toggle('hover', record.id === id); });
        cubeRecords.forEach(function (cube) { cube.element.classList.toggle('hover', cube.sector.id === id); });
      }
      function curTo(x, y, ms) {
        cursor.style.transition = ms ? 'transform ' + ms + 'ms cubic-bezier(.5,0,.2,1),opacity .3s' : 'none';
        cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }
      function click(x, y) {
        ring.style.left = x + 'px';
        ring.style.top = y + 'px';
        ring.classList.remove('p');
        void ring.getBoundingClientRect();
        ring.classList.add('p');
      }
      function aborted() { return new DOMException('Tour cancelled', 'AbortError'); }
      function pause(ms, signal) {
        return new Promise(function (resolve, reject) {
          if (signal.aborted) { reject(aborted()); return; }
          var timer = window.setTimeout(function () { signal.removeEventListener('abort', cancel); resolve(); }, ms);
          function cancel() { window.clearTimeout(timer); reject(aborted()); }
          signal.addEventListener('abort', cancel, { once: true });
        });
      }
      function tween(ms, update, signal) {
        return new Promise(function (resolve, reject) {
          if (signal.aborted) { reject(aborted()); return; }
          var start = performance.now(), id;
          function cancel() { window.cancelAnimationFrame(id); reject(aborted()); }
          signal.addEventListener('abort', cancel, { once: true });
          function step(now) {
            var t = clamp((now - start) / ms);
            update(t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
            if (t < 1) id = window.requestAnimationFrame(step);
            else { signal.removeEventListener('abort', cancel); resolve(); }
          }
          step(start);
        });
      }
      function cam(progress) { camera.progress = progress; render(duration); }
      function cancelAnimations(node) { node.getAnimations().forEach(function (animation) { animation.cancel(); }); }
      async function pictureZoom(signal) {
        try {
          await pause(850, signal);
          picture.animate([{ transform: 'scale(1.04)' }, { transform: 'scale(1.1)' }], { duration: 3000, easing: 'ease-out', fill: 'forwards' });
        } catch (error) { if (error.name !== 'AbortError') throw error; }
      }
      function openPop(signal) {
        var f = stage.clientWidth / 600;
        cancelAnimations(pop);
        cancelAnimations(picture);
        pop.style.transformOrigin = (300 * f - pop.offsetLeft) + 'px ' + (347 * f - pop.offsetTop) + 'px';
        var options = { duration: 850, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'forwards' };
        pop.animate([{ transform: 'scale(.04)', opacity: 0, borderRadius: '90px' }, { opacity: 1, offset: .25 }, { transform: 'scale(1)', opacity: 1, borderRadius: '22px' }], options);
        picture.animate([{ transform: 'scale(1.9)' }, { transform: 'scale(1.04)' }], options);
        pictureZoom(signal);
      }
      function closePop() {
        pop.animate([{ transform: 'scale(1)', opacity: 1 }, { opacity: 1, offset: .7 }, { transform: 'scale(.04)', opacity: 0, borderRadius: '90px' }], { duration: 600, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
        picture.animate([{ transform: 'scale(1.1)' }, { transform: 'scale(1.9)' }], { duration: 450, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      }
      function heart(x, y) {
        var node = document.createElement('div');
        node.className = 'heart';
        node.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path fill="#ff3b5c" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2 0 3.6 1 5.4 3 1.8-2 3.4-3 5.4-3 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>';
        node.style.left = x + 'px';
        node.style.top = y + 'px';
        stage.appendChild(node);
        hearts.push(node);
        node.animate([{ transform: 'translate(0,0) scale(0)', opacity: 1 }, { transform: 'translate(0,-13px) scale(1.9)', opacity: 1, offset: .25 }, { transform: 'translate(0,-44px) scale(1.5)', opacity: 0 }], { duration: 1100, easing: 'ease-out', fill: 'both' }).onfinish = function () {
          node.remove();
          hearts = hearts.filter(function (item) { return item !== node; });
        };
      }
      async function visit(id, label, signal) {
        var sw = stage.clientWidth, zone = labelRecords.find(function (record) { return record.id === id; });
        camera.room = sectors.find(function (sector) { return sector.id === id; });
        camera.point = camera.room.center;
        measureFocus();
        picture.src = pictures[id];
        picture.alt = label === 'HABITACIÓN' ? 'Habitación de Bojana Estudio' : 'Living de Bojana Estudio';
        surface.setAttribute('data-hero-map-phase', id === 'hab' ? 'visiting-bedroom' : 'visiting-living');
        cursor.style.opacity = '1';
        void cursor.getBoundingClientRect();
        curTo(zone.position[0] - destination.left + 8, zone.position[1] - destination.top + 4, 700);
        await pause(700, signal);
        setHover(id);
        await pause(20, signal);
        var position = zone.position;
        click(position[0] - destination.left + 8, position[1] - destination.top + 4);
        setHot(id, true);
        setHover(null);
        svg.classList.add('focus');
        curTo(sw * .5, sw * .36, 950);
        await Promise.all([
          tween(1050, cam, signal),
          (async function () { await pause(400, signal); openPop(signal); })()
        ]);
        await pause(60, signal);
        click(sw * .5, sw * .36);
        await pause(200, signal);
        click(sw * .5, sw * .36);
        heart(sw * .5, sw * .36);
        await pause(1700, signal);
        curTo(sw * .09, sw * .66, 560);
        await pause(580, signal);
        click(sw * .09, sw * .66);
        closePop();
        svg.classList.remove('focus');
        curTo(sw * .3, sw * .76, 850);
        await tween(850, function (t) { cam(1 - t); }, signal);
        setHot(id, false);
      }
      async function loop(signal) {
        await pause(350, signal);
        var first = true;
        while (!signal.aborted) {
          if (!first) {
            camera.progress = 0;
            traceProgress = 0;
            cursor.style.opacity = '0';
            curTo(stage.clientWidth * .92, stage.clientHeight * .9, 0);
            render(duration);
            svg.classList.remove('tour-faded');
            surface.setAttribute('data-hero-map-phase', 'redrawing');
            await pause(100, signal);
            await tween(1300, function (t) { traceProgress = t; render(duration); }, signal);
          }
          first = false;
          await visit('hab', 'HABITACIÓN', signal);
          await visit('liv', 'LIVING', signal);
          svg.classList.add('tour-faded');
          await pause(350, signal);
        }
      }
      function startTour() {
        if (reduce.matches || tour) return;
        tour = new AbortController();
        tourRunning = true;
        curTo(stage.clientWidth * .92, stage.clientHeight * .9, 0);
        loop(tour.signal).catch(function (error) { if (error.name !== 'AbortError') throw error; });
      }
      function stopTour() {
        if (tour) tour.abort();
        tour = null;
        tourRunning = false;
        camera.progress = 0;
        traceProgress = 1;
        activeSector = null;
        hoveredSector = null;
        cubeRecords.forEach(function (cube) { cube.element.classList.remove('hot', 'hover'); });
        svg.classList.remove('focus', 'tour-faded');
        svg.style.clipPath = '';
        ring.classList.remove('p');
        cursor.style.opacity = '0';
        cancelAnimations(pop);
        cancelAnimations(picture);
        hearts.forEach(function (node) { cancelAnimations(node); node.remove(); });
        hearts = [];
        labelRecords.forEach(function (record) { record.element.classList.remove('hot', 'hover'); });
      }
      Object.keys(pictures).forEach(function (id) { var preload = new Image(); preload.src = pictures[id]; });
      replay();
    })();
