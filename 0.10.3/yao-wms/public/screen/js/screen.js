const yao = new Yao();

const app = new Vue({
  el: "#app",
  data: {
    alldata: "",
    api: "/api",
    人员: { 日期: [], 进入: [], 离开: [], Max: 1 },
    物资: { 日期: [], 入库: [], 出库: [], Max: 1 },
    库存: { 日期: [], 总数: [], 预警: [], Max: 1 },
    计划: { 数据: [], 总数: 0, Max: 1 },
    人员状态: 0,
    物资状态: 0,
    库存状态: 0,
    计划状态: 0,
  },
  watch: {
    人员状态() {
      try {
        this.人员出入();
      } catch (err) {}
    },
    物资状态() {
      try {
        this.物资进出();
      } catch (err) {}
    },
    库存状态() {
      try {
        this.库存预警();
      } catch (err) {}
    },
    计划状态() {
      try {
        this.采购计划();
      } catch (err) {}
    },
  },
  methods: {
    //控制字体
    fontSize(res) {
      var docEl = document.documentElement,
        clientWidth =
          window.innerWidth ||
          document.documentElement.clientWidth ||
          document.body.clientWidth;
      if (!clientWidth) return;
      return (res * clientWidth) / 1920;
    },

    // 人员出入数量 #icharts_1
    人员出入数据() {
      yao
        .Get("/screen/user?days=7")
        .then((data) => {
          data = data || [];
          for (var i = 0; i < data.length; i++) {
            this.人员.离开.push(parseInt(data[i].离开));
            this.人员.进入.push(parseInt(data[i].进入));
            this.人员.日期.push(data[i].day);
            this.人员.Max = Math.max(
              this.人员.Max,
              parseInt(data[i].离开) + 2,
              parseInt(data[i].进入) + 2
            );
          }
          this.人员状态 = 1;
        })
        .catch((err) => {});
    },

    // 人员出入数量  #icharts_1
    人员出入() {
      var myChart1 = echarts.init(document.getElementById("icharts_1"));
      myChart1.setOption({
        grid: {
          left: 30,
          right: 30,
          top: 30,
          bottom: 10,
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
            shadowStyle: { color: "rgba(0,156,255,0.2)" },
            z: 1,
          },
          padding: [15, 22],
          backgroundColor: "rgba(0,0,0,0.9)",
          borderColor: "#01a3ce",
          borderWidth: 1,
          textStyle: {
            fontSize: this.fontSize(16),
            lineHeight: this.fontSize(32),
            color: "#ffffff",
          },
        },
        xAxis: {
          data: this.人员.日期,
          boundaryGap: false,
          axisLine: { show: false },
          axisTick: {
            show: true,
            lineStyle: { color: "transparent", width: 1, opacity: 1 },
          },
          axisLabel: {
            textStyle: { fontSize: this.fontSize(12), color: "#39578b" },
            margin: this.fontSize(15),
            interval: 0,
            rotate: 20,
          },
          splitLine: { show: false },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: {
            show: true,
            lineStyle: { color: "#0187c4", width: 1, opacity: 1 },
          },
          axisLabel: {
            textStyle: { fontSize: this.fontSize(12), color: "#9ba2b2" },
            opacity: 0.7,
            margin: 15,
          },
          splitLine: {
            show: true,
            lineStyle: { color: "#3cd1ff", width: 1, opacity: 0.2 },
          },
          min: 0,
          max: this.人员.Max,
        },
        animationDelay: 900,
        animationDuration: 2000,
        animationDurationUpdate: 800,
        series: [
          {
            name: "进入",
            type: "bar",
            z: 12,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#4988f9" },
                { offset: 1, color: "rgba(0,146,255,0.05)" },
              ]),
            },
            label: {
              show: true,
              position: "top",
              distance: this.fontSize(15),
              fontSize: this.fontSize(14),
              color: "#3cd1ff",
              lineHeight: this.fontSize(30),
              fontFamily: "DIN-Medium",
            },
            emphasis: {
              label: { color: "#f3a72f" },
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#f3a72f" },
                  { offset: 1, color: "rgba(243,167,47,0.05)" },
                ]),
              },
            },
            barWidth: this.fontSize(15),
            data: this.人员.进入,
          },
          {
            name: "离开",
            type: "bar",
            z: 12,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#01d4cb" },
                { offset: 1, color: "rgba(0,146,255,0.05)" },
              ]),
            },
            label: {
              show: true,
              position: "top",
              distance: this.fontSize(15),
              fontSize: this.fontSize(14),
              color: "#3cd1ff",
              lineHeight: this.fontSize(30),
              fontFamily: "DIN-Medium",
            },
            emphasis: {
              label: { color: "#01d4cb" },
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#01d4cb" },
                  { offset: 1, color: "rgba(243,167,47,0.05)" },
                ]),
              },
            },
            barWidth: this.fontSize(15),
            data: this.人员.离开,
          },
        ],
      });
    },

    // 物资进出数据
    物资进出数据() {
      //   axios({ method: "get", url: this.api + "/screen/record?days=7" })
      yao
        .Get("/screen/record?days=7")
        .then((data) => {
          data = data || [];
          for (var i = 0; i < data.length; i++) {
            this.物资.入库.push(parseInt(data[i].入库));
            this.物资.出库.push(parseInt(data[i].出库));
            this.物资.日期.push(data[i].day);
            this.物资.Max = Math.max(
              this.物资.Max,
              parseInt(data[i].入库) + 2,
              parseInt(data[i].出库) + 2
            );
          }
          this.物资状态 = 1;
        })
        .catch((err) => {});
    },

    // 物资进出 #icharts_2
    物资进出() {
      var myChart2 = echarts.init(document.getElementById("icharts_2"));
      myChart2.setOption({
        grid: {
          left: 30,
          right: 30,
          top: 30,
          bottom: 10,
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "line",
            lineStyle: {
              color: "#00c9fb",
              opacity: 0.7,
              type: "dashed",
              width: 1,
            },
            z: 1,
          },
          padding: [15, 22],
          backgroundColor: "rgba(0,0,0,0.9)",
          borderColor: "#01a3ce",
          borderWidth: 1,
          textStyle: {
            fontSize: this.fontSize(14),
            lineHeight: this.fontSize(32),
            color: "#ffffff",
          },
        },
        xAxis: {
          data: this.物资.日期,
          boundaryGap: false,
          axisLine: { show: false },
          axisTick: {
            show: true,
            lineStyle: { color: "transparent", width: 1, opacity: 1 },
          },
          axisLabel: {
            textStyle: { fontSize: this.fontSize(12), color: "#39578b" },
            margin: this.fontSize(15),
            interval: 0,
            rotate: 20,
          },
          splitLine: { show: false },
        },
        yAxis: {
          position: "right",
          type: "value",
          axisLine: { show: false },
          axisTick: {
            show: true,
            lineStyle: { color: "transparent", width: 1, opacity: 1 },
          },
          axisLabel: {
            textStyle: { fontSize: this.fontSize(12), color: "#39578b" },
            opacity: 0.7,
            margin: this.fontSize(15),
          },
          splitLine: {
            show: true,
            lineStyle: { color: "#13375c", width: 1, opacity: 0.2 },
          },
          min: 0,
          max: this.物资.Max,
        },
        animationDelay: 900,
        animationDuration: 2000,
        animationDurationUpdate: 800,
        series: [
          {
            type: "line",
            name: "入库",
            symbol: "circle",
            symbolSize: this.fontSize(12),
            showSymbol: false,
            smooth: true,
            itemStyle: {
              color: "#02a8fe",
              borderColor: "#ffffff",
              borderWidth: 3,
              borderType: "solid",
            },
            lineStyle: { color: "#02a8fe", width: 1 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#02a8fe" },
                { offset: 1, color: "transparent" },
              ]),
              opacity: 0.3,
            },
            data: this.物资.入库,
          },
          {
            type: "line",
            name: "出库",
            symbol: "circle",
            symbolSize: this.fontSize(12),
            showSymbol: false,
            smooth: true,
            itemStyle: {
              color: "#00f3fe",
              borderColor: "#ffffff",
              borderWidth: 3,
              borderType: "solid",
            },
            lineStyle: { color: "#00f3fe", width: 1 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#00f3fe" },
                { offset: 1, color: "transparent" },
              ]),
              opacity: 0.3,
            },
            data: this.物资.出库,
          },
        ],
      });
    },

    // 库存预警数据
    库存预警数据() {
      yao
        .Get("/screen/stock?days=7")
        .then((data) => {
          data = data || [];
          for (var i = 0; i < data.length; i++) {
            this.库存.总数.push(parseInt(data[i].总数));
            this.库存.预警.push(parseInt(data[i].预警));
            this.库存.日期.push(data[i].day);
            this.库存.Max = Math.max(
              this.库存.Max,
              parseInt(data[i].总数) + 2,
              parseInt(data[i].预警) + 2
            );
          }
          this.库存状态 = 1;
        })
        .catch((err) => {});
    },

    // 库存预警 #icharts_5
    库存预警() {
      var myChart5 = echarts.init(document.getElementById("icharts_5"));
      myChart5.setOption({
        grid: {
          left: 30,
          right: 30,
          top: 30,
          bottom: 10,
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "line",
            lineStyle: {
              color: "#00c9fb",
              opacity: 0.7,
              type: "dashed",
              width: 1,
            },
            z: 1,
          },
          padding: [15, 22],
          backgroundColor: "rgba(0,0,0,0.9)",
          borderColor: "#01a3ce",
          borderWidth: 1,
          textStyle: {
            fontSize: this.fontSize(14),
            lineHeight: this.fontSize(32),
            color: "#ffffff",
          },
        },
        xAxis: {
          data: this.库存.日期,
          boundaryGap: false,
          axisLine: { show: false },
          axisTick: {
            show: true,
            lineStyle: { color: "transparent", width: 1, opacity: 1 },
          },
          axisLabel: {
            textStyle: { fontSize: this.fontSize(12), color: "#39578b" },
            margin: this.fontSize(15),
            interval: 0,
            rotate: 20,
          },
          splitLine: { show: false },
        },
        yAxis: {
          position: "right",
          type: "value",
          axisLine: { show: false },
          axisTick: {
            show: true,
            lineStyle: { color: "transparent", width: 1, opacity: 1 },
          },
          axisLabel: {
            textStyle: { fontSize: this.fontSize(12), color: "#39578b" },
            opacity: 0.7,
            margin: this.fontSize(15),
          },
          splitLine: {
            show: true,
            lineStyle: { color: "#13375c", width: 1, opacity: 0.2 },
          },
          min: 0,
          max: this.库存.Max,
        },
        animationDelay: 900,
        animationDuration: 2000,
        animationDurationUpdate: 800,
        series: [
          {
            name: "SKU总数",
            type: "bar",
            z: 12,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#4988f9" },
                { offset: 1, color: "rgba(0,146,255,0.05)" },
              ]),
            },
            label: {
              show: true,
              position: "top",
              distance: this.fontSize(15),
              fontSize: this.fontSize(14),
              color: "#3cd1ff",
              lineHeight: this.fontSize(30),
              fontFamily: "DIN-Medium",
            },
            emphasis: {
              label: { color: "#f3a72f" },
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#f3a72f" },
                  { offset: 1, color: "rgba(243,167,47,0.05)" },
                ]),
              },
            },
            barWidth: this.fontSize(15),
            data: this.库存.总数,
          },
          {
            type: "line",
            name: "库存预警",
            symbol: "circle",
            symbolSize: this.fontSize(12),
            showSymbol: false,
            smooth: true,
            itemStyle: {
              color: "#00f3fe",
              borderColor: "#ffffff",
              borderWidth: 3,
              borderType: "solid",
            },
            lineStyle: { color: "#00f3fe", width: 1 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#00f3fe" },
                { offset: 1, color: "transparent" },
              ]),
              opacity: 0.3,
            },
            data: this.库存.预警,
          },
        ],
      });
    },

    //报告情况
    采购计划数据() {
      yao
        .Get("/screen/plan?days=60")
        .then((data) => {
          var total = 0;
          this.计划 = { 数据: [], 总数: 0, Max: 1 };
          for (var i = 0; i < data.length; i++) {
            var plan = {
              name: data[i].name,
              value: parseInt(data[i].数量),
            };
            total = plan.value + total;
            this.计划.数据.push(plan);
          }
          this.计划.总数 = total;
          this.计划.Min = total;
          this.计划状态 = 1;
        })
        .catch((err) => {});
    },

    //报告情况图表 #icharts_3
    采购计划() {
      var myChart3 = echarts.init(document.getElementById("icharts_3"));
      myChart3.setOption({
        title: {
          text: this.计划.总数,
          subtext: "共计",
          left: "center",
          top: "center",
          textStyle: {
            color: "#fff",
            fontSize: this.fontSize(25),
            fontWeight: "bold",
          },
          subtextStyle: {
            color: "#6a94ce",
            fontSize: this.fontSize(17),
          },
        },
        color: ["#fed267", "#01d4cb", "#009eff"],
        tooltip: {
          padding: [15, 22],
          backgroundColor: "rgba(0,0,0,0.9)",
          borderColor: "#01a3ce",
          borderWidth: 1,
          textStyle: {
            fontSize: this.fontSize(15),
            lineHeight: this.fontSize(32),
            color: "#ffffff",
          },
        },
        animationDelay: 900,
        animationDuration: 2000,
        animationDurationUpdate: 800,
        series: [
          {
            type: "pie",
            radius: ["46%", "68%"],
            minAngle: 1,
            label: {
              formatter: ["{a|{b}}", "{d}%"].join("\n"),
              // formatter: ["{d}%"].join("\n"),
              rich: {
                a: {
                  fontSize: this.fontSize(15),
                  lineHeight: this.fontSize(32),
                  color: "#6697c2",
                },
                b: {
                  fontSize: this.fontSize(13),
                  fontWeight: "bold",
                  lineHeight: this.fontSize(26),
                  color: "#3cd1ff",
                  fontFamily: "DIN-Medium",
                },
              },
            },
            labelLine: {
              length: this.fontSize(28),
              length2: this.fontSize(14),
            },
            // itemStyle: { shadowColor: '#000', shadowBlur: 65, shadowOffsetX: '20', shadowOffsetY: '0', },
            data: this.计划.数据,
          },
        ],
      });
    },
  },
  async mounted() {},
});

/**
 * 大屏幕控制
 */
function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen =
    docEl.requestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.webkitRequestFullScreen ||
    docEl.msRequestFullscreen;
  var cancelFullScreen =
    doc.exitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.webkitExitFullscreen ||
    doc.msExitFullscreen;

  if (
    !doc.fullscreenElement &&
    !doc.mozFullScreenElement &&
    !doc.webkitFullscreenElement &&
    !doc.msFullscreenElement
  ) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
    window.location = "/xiang/kanban/index";
  }
}
