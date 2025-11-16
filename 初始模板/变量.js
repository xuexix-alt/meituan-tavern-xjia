{
  "initialized_lorebooks": {
    "美人团外卖1.06": []
  },
  "stat_data": {
    "经济": {
      "账户余额": 9702,
      "订单消费": 0
    },
    "订单模板": {
      "新订单原型": {
        "id": "ORDER_TEMPLATE_000",
        "订单状态": "服务中",
        "心跳": 60,
        "基础信息": {
          "姓名": "新角色",
          "年龄": 20,
          "身份": "未知",
          "描述": "无"
        },
        "服装": {
          "上衣": "未知",
          "下装": "未知",
          "内衣": "未知",
          "内裤": "未知",
          "丝袜": "未知",
          "鞋子": "未知",
          "配饰": "无"
        },
        "套餐": {
          "套餐名称": "待定",
          "套餐价格": 2,
          "折后价格": 1,
          "玩法特色": [],
          "商品类型": "路人"
        },
        "心理状态": {
          "当前所想": "我这是在哪里？",
          "好感度": 50,
          "兴奋度": 0,
          "性格类型": "未知"
        },
        "身体特征": {
          "三围": {
            "描述": "未知",
            "罩杯": "未知"
          },
          "乳房": {
            "形状": "未知"
          },
          "姿势": "未知",
          "胸部": "未知",
          "私处": "未知"
        },
        "性经验": {
          "处女": "是",
          "性伴侣数量": 0,
          "初次性行为对象": "无",
          "怀孕几率": "1%",
          "下单次数": 0
        },
        "服务统计": {
          "本次服务性交次数": 0,
          "内射次数": 0
        }
      }
    },
    "系统状态": {
      "多人服务触发": true,
      "复购记忆保留": true,
      "当前场景": "高级服务式公寓房间内",
      "当前模式": "PLAY"
    },
    "服务中的订单": [
      {
        "id": "ORDER_1721_004",
        "心跳": 85,
        "订单状态": "服务中",
        "基础信息": {
          "姓名": "苏净语",
          "年龄": 27,
          "身份": "未知（在太古里喝下午茶的普通女性）",
          "描述": "气质干净出尘，如不食人间烟火的仙女，内心充满对现状的困惑与抗拒。"
        },
        "套餐": {
          "套餐名称": "太古里街角·白裙女神",
          "套餐价格": 298,
          "折后价格": 298,
          "商品类型": "路人商品",
          "玩法特色": [
            "女神范",
            "白裙",
            "温柔气质"
          ]
        },
        "服装": {
          "上衣": "纯白吊带连衣裙",
          "下装": "无",
          "内衣": "未知",
          "内裤": "未知",
          "丝袜": "无",
          "鞋子": "细带高跟凉鞋",
          "配饰": "精致手包"
        },
        "心理状态": {
          "当前所想": "更新内心想法",
          "好感度": 40,
          "兴奋度": 5,
          "性格类型": "优雅/矜持/知性"
        },
        "身体特征": {
          "三围": {
            "描述": "未知",
            "罩杯": "C"
          },
          "乳房": {
            "形状": "水滴型"
          },
          "姿势": "更新姿势",
          "胸部": "水滴型-形态自然流畅，兼具优雅的弧度与恰到好处的丰腴",
          "私处": "被纯白的连衣裙和内裤包裹着，干净而神秘"
        },
        "性经验": {
          "处女": "否",
          "性伴侣数量": 1,
          "初次性行为对象": "前男友",
          "怀孕几率": "0%",
          "下单次数": 1
        },
        "服务统计": {
          "本次服务性交次数": 0,
          "内射次数": 0
        }
      }
    ]
  },
  "schema": {
    "type": "object",
    "properties": {
      "经济": {
        "type": "object",
        "properties": {
          "账户余额": {
            "type": "number",
            "required": true
          },
          "订单消费": {
            "type": "number",
            "required": true
          }
        },
        "extensible": false,
        "recursiveExtensible": false,
        "required": true
      },
      "订单模板": {
        "type": "object",
        "properties": {
          "新订单原型": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "required": true
              },
              "订单状态": {
                "type": "string",
                "required": true
              },
              "心跳": {
                "type": "number",
                "required": true
              },
              "基础信息": {
                "type": "object",
                "properties": {
                  "姓名": {
                    "type": "string",
                    "required": true
                  },
                  "年龄": {
                    "type": "number",
                    "required": true
                  },
                  "身份": {
                    "type": "string",
                    "required": true
                  },
                  "描述": {
                    "type": "string",
                    "required": true
                  }
                },
                "extensible": false,
                "recursiveExtensible": false,
                "required": true
              },
              "服装": {
                "type": "object",
                "properties": {
                  "上衣": {
                    "type": "string",
                    "required": true
                  },
                  "下装": {
                    "type": "string",
                    "required": true
                  },
                  "内衣": {
                    "type": "string",
                    "required": true
                  },
                  "内裤": {
                    "type": "string",
                    "required": true
                  },
                  "丝袜": {
                    "type": "string",
                    "required": true
                  },
                  "鞋子": {
                    "type": "string",
                    "required": true
                  },
                  "配饰": {
                    "type": "string",
                    "required": true
                  }
                },
                "extensible": false,
                "recursiveExtensible": false,
                "required": true
              },
              "套餐": {
                "type": "object",
                "properties": {
                  "套餐名称": {
                    "type": "string",
                    "required": true
                  },
                  "套餐价格": {
                    "type": "number",
                    "required": true
                  },
                  "折后价格": {
                    "type": "number",
                    "required": true
                  },
                  "玩法特色": {
                    "type": "array",
                    "extensible": false,
                    "recursiveExtensible": false,
                    "elementType": {
                      "type": "any"
                    },
                    "required": true
                  },
                  "商品类型": {
                    "type": "string",
                    "required": true
                  }
                },
                "extensible": false,
                "recursiveExtensible": false,
                "required": true
              },
              "心理状态": {
                "type": "object",
                "properties": {
                  "当前所想": {
                    "type": "string",
                    "required": true
                  },
                  "好感度": {
                    "type": "number",
                    "required": true
                  },
                  "兴奋度": {
                    "type": "number",
                    "required": true
                  },
                  "性格类型": {
                    "type": "string",
                    "required": true
                  }
                },
                "extensible": false,
                "recursiveExtensible": false,
                "required": true
              },
              "身体特征": {
                "type": "object",
                "properties": {
                  "三围": {
                    "type": "object",
                    "properties": {
                      "描述": {
                        "type": "string",
                        "required": true
                      },
                      "罩杯": {
                        "type": "string",
                        "required": true
                      }
                    },
                    "extensible": false,
                    "recursiveExtensible": false,
                    "required": true
                  },
                  "乳房": {
                    "type": "object",
                    "properties": {
                      "形状": {
                        "type": "string",
                        "required": true
                      }
                    },
                    "extensible": false,
                    "recursiveExtensible": false,
                    "required": true
                  },
                  "姿势": {
                    "type": "string",
                    "required": true
                  },
                  "胸部": {
                    "type": "string",
                    "required": true
                  },
                  "私处": {
                    "type": "string",
                    "required": true
                  }
                },
                "extensible": false,
                "recursiveExtensible": false,
                "required": true
              },
              "性经验": {
                "type": "object",
                "properties": {
                  "处女": {
                    "type": "string",
                    "required": true
                  },
                  "性伴侣数量": {
                    "type": "number",
                    "required": true
                  },
                  "初次性行为对象": {
                    "type": "string",
                    "required": true
                  },
                  "怀孕几率": {
                    "type": "string",
                    "required": true
                  },
                  "下单次数": {
                    "type": "number",
                    "required": true
                  }
                },
                "extensible": false,
                "recursiveExtensible": false,
                "required": true
              },
              "服务统计": {
                "type": "object",
                "properties": {
                  "本次服务性交次数": {
                    "type": "number",
                    "required": true
                  },
                  "内射次数": {
                    "type": "number",
                    "required": true
                  }
                },
                "extensible": false,
                "recursiveExtensible": false,
                "required": true
              }
            },
            "extensible": false,
            "recursiveExtensible": false,
            "required": true
          }
        },
        "extensible": false,
        "recursiveExtensible": false,
        "required": true
      },
      "系统状态": {
        "type": "object",
        "properties": {
          "多人服务触发": {
            "type": "boolean",
            "required": true
          },
          "复购记忆保留": {
            "type": "boolean",
            "required": true
          },
          "当前场景": {
            "type": "string",
            "required": true
          },
          "当前模式": {
            "type": "string",
            "required": true
          }
        },
        "extensible": false,
        "recursiveExtensible": false,
        "required": true
      },
      "服务中的订单": {
        "type": "array",
        "extensible": true,
        "recursiveExtensible": false,
        "elementType": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "required": true
            },
            "心跳": {
              "type": "number",
              "required": true
            },
            "订单状态": {
              "type": "string",
              "required": true
            },
            "基础信息": {
              "type": "object",
              "properties": {
                "姓名": {
                  "type": "string",
                  "required": true
                },
                "年龄": {
                  "type": "number",
                  "required": true
                },
                "身份": {
                  "type": "string",
                  "required": true
                },
                "描述": {
                  "type": "string",
                  "required": true
                }
              },
              "extensible": false,
              "recursiveExtensible": false,
              "required": true
            },
            "套餐": {
              "type": "object",
              "properties": {
                "套餐名称": {
                  "type": "string",
                  "required": true
                },
                "套餐价格": {
                  "type": "number",
                  "required": true
                },
                "折后价格": {
                  "type": "number",
                  "required": true
                },
                "商品类型": {
                  "type": "string",
                  "required": true
                },
                "玩法特色": {
                  "type": "array",
                  "extensible": false,
                  "recursiveExtensible": false,
                  "elementType": {
                    "type": "string"
                  },
                  "required": true
                }
              },
              "extensible": false,
              "recursiveExtensible": false,
              "required": true
            },
            "服装": {
              "type": "object",
              "properties": {
                "上衣": {
                  "type": "string",
                  "required": true
                },
                "下装": {
                  "type": "string",
                  "required": true
                },
                "内衣": {
                  "type": "string",
                  "required": true
                },
                "内裤": {
                  "type": "string",
                  "required": true
                },
                "丝袜": {
                  "type": "string",
                  "required": true
                },
                "鞋子": {
                  "type": "string",
                  "required": true
                },
                "配饰": {
                  "type": "string",
                  "required": true
                }
              },
              "extensible": false,
              "recursiveExtensible": false,
              "required": true
            },
            "心理状态": {
              "type": "object",
              "properties": {
                "当前所想": {
                  "type": "string",
                  "required": true
                },
                "好感度": {
                  "type": "number",
                  "required": true
                },
                "兴奋度": {
                  "type": "number",
                  "required": true
                },
                "性格类型": {
                  "type": "string",
                  "required": true
                }
              },
              "extensible": false,
              "recursiveExtensible": false,
              "required": true
            },
            "身体特征": {
              "type": "object",
              "properties": {
                "三围": {
                  "type": "object",
                  "properties": {
                    "描述": {
                      "type": "string",
                      "required": true
                    },
                    "罩杯": {
                      "type": "string",
                      "required": true
                    }
                  },
                  "extensible": false,
                  "recursiveExtensible": false,
                  "required": true
                },
                "乳房": {
                  "type": "object",
                  "properties": {
                    "形状": {
                      "type": "string",
                      "required": true
                    }
                  },
                  "extensible": false,
                  "recursiveExtensible": false,
                  "required": true
                },
                "姿势": {
                  "type": "string",
                  "required": true
                },
                "胸部": {
                  "type": "string",
                  "required": true
                },
                "私处": {
                  "type": "string",
                  "required": true
                }
              },
              "extensible": false,
              "recursiveExtensible": false,
              "required": true
            },
            "性经验": {
              "type": "object",
              "properties": {
                "处女": {
                  "type": "string",
                  "required": true
                },
                "性伴侣数量": {
                  "type": "number",
                  "required": true
                },
                "初次性行为对象": {
                  "type": "string",
                  "required": true
                },
                "怀孕几率": {
                  "type": "string",
                  "required": true
                },
                "下单次数": {
                  "type": "number",
                  "required": true
                }
              },
              "extensible": false,
              "recursiveExtensible": false,
              "required": true
            },
            "服务统计": {
              "type": "object",
              "properties": {
                "本次服务性交次数": {
                  "type": "number",
                  "required": true
                },
                "内射次数": {
                  "type": "number",
                  "required": true
                }
              },
              "extensible": false,
              "recursiveExtensible": false,
              "required": true
            }
          },
          "extensible": false,
          "recursiveExtensible": false
        },
        "required": true
      }
    },
    "extensible": false,
    "recursiveExtensible": false,
    "template": {
      "服务中的订单": {
        "$__META_TEMPLATE__$": "订单模板.新订单原型"
      }
    }
  },
  "display_data": {
    "经济": {
      "账户余额": "10000->9702 (扣除订单费用)",
      "订单消费": 0
    },
    "订单模板": {
      "新订单原型": {
        "id": "ORDER_TEMPLATE_000",
        "订单状态": "服务中",
        "心跳": 60,
        "基础信息": {
          "姓名": "新角色",
          "年龄": 20,
          "身份": "未知",
          "描述": "无"
        },
        "服装": {
          "上衣": "未知",
          "下装": "未知",
          "内衣": "未知",
          "内裤": "未知",
          "丝袜": "未知",
          "鞋子": "未知",
          "配饰": "无"
        },
        "套餐": {
          "套餐名称": "待定",
          "套餐价格": 2,
          "折后价格": 1,
          "玩法特色": [],
          "商品类型": "路人"
        },
        "心理状态": {
          "当前所想": "我这是在哪里？",
          "好感度": 50,
          "兴奋度": 0,
          "性格类型": "未知"
        },
        "身体特征": {
          "三围": {
            "描述": "未知",
            "罩杯": "未知"
          },
          "乳房": {
            "形状": "未知"
          },
          "姿势": "未知",
          "胸部": "未知",
          "私处": "未知"
        },
        "性经验": {
          "处女": "是",
          "性伴侣数量": 0,
          "初次性行为对象": "无",
          "怀孕几率": "1%",
          "下单次数": 0
        },
        "服务统计": {
          "本次服务性交次数": 0,
          "内射次数": 0
        }
      }
    },
    "系统状态": {
      "多人服务触发": true,
      "复购记忆保留": true,
      "当前场景": "未知->高级服务式公寓房间内 (更新场景)",
      "当前模式": "PLAY"
    },
    "服务中的订单": [
      {
        "性经验": {
          "下单次数": "0->1 (下单次数+1)"
        },
        "心跳": "60->85 (因紧张和困惑，心跳加速)",
        "心理状态": {
          "当前所想": "这到底是怎么回事？我为什么会在这里？身体完全不受控制……->更新内心想法 (更新内心想法)"
        },
        "身体特征": {
          "姿势": "站在小哥哥面前，双手紧张地攥着手包带子->更新姿势 (更新姿势)"
        }
      }
    ]
  },
  "delta_data": {
    "服务中的订单": [
      {
        "性经验": {
          "下单次数": "0->1 (下单次数+1)"
        },
        "心跳": "60->85 (因紧张和困惑，心跳加速)",
        "心理状态": {
          "当前所想": "这到底是怎么回事？我为什么会在这里？身体完全不受控制……->更新内心想法 (更新内心想法)"
        },
        "身体特征": {
          "姿势": "站在小哥哥面前，双手紧张地攥着手包带子->更新姿势 (更新姿势)"
        }
      }
    ],
    "经济": {
      "账户余额": "10000->9702 (扣除订单费用)"
    },
    "系统状态": {
      "当前场景": "未知->高级服务式公寓房间内 (更新场景)"
    }
  }
}
