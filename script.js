document.getElementById("morphology-button").addEventListener("click", () => {

    const inputFile = document.getElementById("image_uploads").files[0];
    if (!inputFile) {
        alert("Пожалуйста, выберите изображение");
        return;
    }

    const kernelSize = parseInt(document.getElementById("kernel-size").value) || 5;
    const elementType = document.getElementById("structure-element").value;
    let element;

    switch (elementType) {
        case "rect":
            element = cv.MORPH_RECT;
            break;
        case "cross":
            element = cv.MORPH_CROSS;
            break;
        case "ell":
            element = cv.MORPH_ELLIPSE;
            break;
        case "diamond":
            element = createDiamondKernel(kernelSize);
            break;
        default:
            element = cv.MORPH_RECT;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            const src = cv.imread(img);
            const kernel = element === createDiamondKernel(kernelSize) ? element : cv.getStructuringElement(element, new cv.Size(kernelSize, kernelSize));
            const dst_er = new cv.Mat();
            const dst_dil = new cv.Mat();
            const dst_op = new cv.Mat();
            const dst_close = new cv.Mat();

            cv.erode(src, dst_er, kernel);
            cv.dilate(src, dst_dil, kernel);
            cv.morphologyEx(src, dst_op, cv.MORPH_OPEN, kernel);
            cv.morphologyEx(src, dst_close, cv.MORPH_CLOSE, kernel);

            /*for (let f in filters) {
                document.getElementById(f + '-filter').src = statisticalFilter(src, filters[f])
            }*/
            for (let f in filters) {
                const filterResult = statisticalFilter(src, filters[f]);
                cv.imshow(f + '-filter', filterResult);
                filterResult.delete();
            }



            cv.imshow("output_start", src)
            cv.imshow("output_er", dst_er);
            cv.imshow("output_dil", dst_dil);
            cv.imshow("output_op", dst_op);
            cv.imshow("output_close", dst_close);

            src.delete();
            kernel.delete();
            dst_er.delete();
            dst_dil.delete();
            dst_op.delete();
            dst_close.delete();
        };
    };
    reader.readAsDataURL(inputFile);
});

const filters = {
    'max': max,
    'min': min,
    'median': median
}



function createDiamondKernel(size) {
    const kernel = new cv.Mat.zeros(size, size, cv.CV_8U);
    const center = Math.floor(size / 2);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (Math.abs(i - center) + Math.abs(j - center) <= center) {
                kernel.ucharPtr(i, j)[0] = 1;
            }
        }
    }
    return kernel;
}

function median(array) {
    array.sort((a, b) => a - b)
    return array[Math.floor(array.length / 2)];
}

function max(array) {
    let res = undefined;
    for (let i of array) {
        if (res === undefined) {
            res = i;
        } else {
            res = Math.max(res, i);
        }
    }
    return res;
}

function min(array) {
    let res = undefined;
    for (let i of array) {
        if (res === undefined) {
            res = i;
        } else {
            res = Math.min(res, i);
        }
    }
    return res;
}

function statisticalFilter(image, statistics) {
    const w = image.cols;
    const h = image.rows;

    let result = new cv.Mat(h, w, cv.CV_8UC3);

    for (let i = 0; i < h; ++i) {
        for (let j = 0; j < w; ++j) {
            let pixel = getStatisticalPixel(image, statistics, i, j);
            result.ucharPtr(i, j)[0] = pixel[0];
            result.ucharPtr(i, j)[1] = pixel[1];
            result.ucharPtr(i, j)[2] = pixel[2];
        }
    }
    return result;
}

function getStatisticalPixel(image, statistics, i, j, kernel = 3) {
    let depth = image.channels();
    let result = Array(depth);

    let p = Math.floor(kernel / 2);
    for (let c = 0; c < depth; ++c) {
        let pixels = [];
        for (let ii = -p; ii <= p; ++ii) {
            if (i + ii < 0 || i + ii >= image.rows) continue;
            for (let jj = -p; jj <= p; ++jj) {
                if (j + jj < 0 || j + jj >= image.cols) continue;
                pixels.push(image.ucharPtr(i + ii, j + jj)[c]);
            }
        }
        result[c] = statistics(pixels);
    }
    return result;
}
