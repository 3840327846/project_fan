// 物品类
class Item {
    constructor(data) {
        this.name = data.name;
        this.type = data.type; // "蛋"、"材料"、"食物"、"装备"、"道具"、"货币"、"其它"
        this.icon = data.icon;
        this.description = data.description;
        this.effect = data.effect;
        this.buyPrice = data.buyPrice;
        this.sellPrice = data.sellPrice;
        this.rarity = data.rarity; // "普通"、"稀有"、"神话"、"传说"、"特殊"
        this.skillId = data.skillId; // 技能书的技能ID
        
        // 装备特有属性
        if (this.type === "装备") {
            this.equipmentType = data.equipmentType; // "武器"、"副手"、"护甲"、"杂项"
            this.quality = data.quality;
            this.qualityColor = data.qualityColor;
            this.mainAffix = data.mainAffix;
            
            // 生成副词条
            this.subAffixes = this.generateSubAffixes();
        }
    }
    
    // 生成副词条
    generateSubAffixes() {
        if (this.type !== "装备") return [];
        
        // 根据稀有度确定副词条数量
        const affixCounts = {
            "普通": 1,
            "稀有": 2,
            "神话": 3,
            "传说": 4
        };
        
        const affixCount = affixCounts[this.rarity] || 1;
        const subAffixes = [];
        
        // 获取词条稀有度权重
        const rarityWeights = AffixPresets.getAffixRarityWeights(this.rarity);
        const affixesByRarity = AffixPresets.getAffixesByRarity();
        
        for (let i = 0; i < affixCount; i++) {
            // 根据权重随机选择词条稀有度
            const selectedRarity = this.weightedRandomSelect(rarityWeights);
            
            // 从该稀有度的词条中随机选择
            const availableAffixes = affixesByRarity[selectedRarity];
            if (availableAffixes && availableAffixes.length > 0) {
                const randomAffixId = availableAffixes[Math.floor(Math.random() * availableAffixes.length)];
                const affixPreset = AffixPresets.getPreset(randomAffixId);
                
                if (affixPreset) {
                    // 生成随机数值
                    const value = this.generateRandomValue(affixPreset.minValue, affixPreset.maxValue);
                    
                    subAffixes.push({
                        name: affixPreset.name,
                        attribute: affixPreset.attribute,
                        value: value,
                        rarity: affixPreset.rarity
                    });
                }
            }
        }
        
        return subAffixes;
    }
    
    // 权重随机选择
    weightedRandomSelect(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [rarity, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return rarity;
            }
        }
        
        return Object.keys(weights)[0]; // 默认返回第一个
    }
    
    // 生成随机数值
    generateRandomValue(min, max) {
        if (typeof min === 'number' && typeof max === 'number') {
            if (Number.isInteger(min) && Number.isInteger(max)) {
                // 整数范围
                return Math.floor(Math.random() * (max - min + 1)) + min;
            } else {
                // 浮点数范围
                return Math.round((Math.random() * (max - min) + min) * 10) / 10;
            }
        }
        return min;
    }
    
    // 获取装备的所有属性加成
    getEquipmentBonuses() {
        if (this.type !== "装备") return {};
        
        const bonuses = {};
        
        // 解析主词条
        if (this.mainAffix) {
            const mainBonuses = this.parseAffixString(this.mainAffix);
            Object.assign(bonuses, mainBonuses);
        }
        
        // 添加副词条
        if (this.subAffixes) {
            this.subAffixes.forEach(affix => {
                if (bonuses[affix.attribute]) {
                    bonuses[affix.attribute] += affix.value;
                } else {
                    bonuses[affix.attribute] = affix.value;
                }
            });
        }
        
        return bonuses;
    }
    
    // 解析词条字符串 (如 "3攻击力、10最大生命值")
    parseAffixString(affixString) {
        const bonuses = {};
        const parts = affixString.split('、');
        
        parts.forEach(part => {
            const match = part.match(/(\d+(?:\.\d+)?)(.+)/);
            if (match) {
                const value = parseFloat(match[1]);
                const attributeName = match[2];
                
                // 属性名映射
                const attributeMap = {
                    '攻击力': 'attackPower',
                    '防御力': 'defense',
                    '最大生命值': 'maxHealth',
                    '移动速度': 'moveSpeed',
                    '生命恢复速度': 'healthRegen',
                    '魔法恢复速度': 'manaRegen',
                    '经验值获取量': 'expGain',
                    '力量': 'strength',
                    '敏捷': 'agility',
                    '智慧': 'intelligence',
                    '技巧': 'skill'
                };
                
                const attribute = attributeMap[attributeName];
                if (attribute) {
                    bonuses[attribute] = value;
                }
            }
        });
        
        return bonuses;
    }
    
    // 获取稀有度颜色
    getRarityColor() {
        const colors = {
            '普通': '#FFFFFF',
            '稀有': '#4A90E2',
            '神话': '#9B59B6',
            '传说': '#E67E22',
            '特殊': '#27AE60'
        };
        return colors[this.rarity] || '#FFFFFF';
    }
}

// 蛋类
class Egg extends Item {
    constructor(data) {
        super(data);
        
        // 蛋的5项主属性
        this.attributes = {
            satiety: { current: 0, max: 100 }, // 饱腹
            strength: { current: 0, max: this.generateMaxValue() }, // 强壮
            vitality: { current: 0, max: this.generateMaxValue() }, // 活力
            wisdom: { current: 0, max: this.generateMaxValue() }, // 悟性
            cleverness: { current: 0, max: this.generateMaxValue() } // 机灵
        };
    }
    
    // 根据稀有度生成最大数值
    generateMaxValue() {
        const ranges = {
            '普通': [0, 10],
            '稀有': [0, 20],
            '神话': [0, 50],
            '传说': [0, 100],
            '特殊': [0, 15]
        };
        
        const range = ranges[this.rarity] || [0, 10];
        return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    }
    
    // 检查是否可以孵化
    canHatch() {
        return this.attributes.satiety.current >= this.attributes.satiety.max;
    }
    
    // 孵化蛋，返回随机角色
    hatch() {
        if (!this.canHatch()) {
            return null;
        }
        
        // 随机选择角色类型
        const types = ['random_strength', 'random_agility', 'random_intelligence', 'random_skill'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        // 创建基础角色
        const baseCharacter = new Character(CharacterPresets.getPreset(randomType));
        
        // 根据蛋的属性分配8点属性点
        this.distributeAttributePoints(baseCharacter);
        
        return baseCharacter;
    }
    
    // 根据蛋的属性分配属性点
    distributeAttributePoints(character) {
        const totalPoints = 8;
        const attributeNames = ['strength', 'agility', 'intelligence', 'skill'];
        
        // 第一步：完全随机分配8点属性点
        for (let i = 0; i < totalPoints; i++) {
            const randomAttr = attributeNames[Math.floor(Math.random() * attributeNames.length)];
            character.attributes[randomAttr]++;
        }
        
        console.log('随机分配8点后的属性:', {...character.attributes});
        
        // 第二步：根据蛋的当前属性值额外增加对应属性
        const eggBonuses = {
            strength: this.attributes.strength.current,    // 当前强壮 → 力量
            agility: this.attributes.vitality.current,     // 当前活力 → 敏捷
            intelligence: this.attributes.cleverness.current, // 当前机灵 → 智慧
            skill: this.attributes.wisdom.current          // 当前悟性 → 技巧
        };
        
        // 应用蛋属性加成
        character.attributes.strength += eggBonuses.strength;
        character.attributes.agility += eggBonuses.agility;
        character.attributes.intelligence += eggBonuses.intelligence;
        character.attributes.skill += eggBonuses.skill;
        
        console.log('蛋属性加成:', eggBonuses);
        console.log('最终角色属性:', character.attributes);
        
        // 重新计算副属性和生命值
        character.updateAttributes();
        
        // 将当前生命值设置为最大生命值
        character.currentHealth = character.maxHealth;
        
        // 孵化时解锁第一个技能槽（如果还没解锁的话）
        if (character.skillSlotLocks[0]) {
            character.unlockSkillSlot(0);
        }
        
        // 孵化时解锁技能槽1并自动装备被动技能
        character.skillSlot1Locked = false;
        character.skillSlotLocks[0] = false;
        
        // 孵化时同时解锁技能槽位1（索引1）作为主动技能槽
        character.skillSlotLocks[1] = false;
        
        // 从被动技能库中随机选择一个技能自动装备到技能槽1（现在是第一个位置）
        const passiveSkills = SkillPresets.getSkillsByType('passive');
        if (passiveSkills.length > 0) {
            const randomPassiveSkillId = passiveSkills[Math.floor(Math.random() * passiveSkills.length)];
            const skillPreset = SkillPresets.getPreset(randomPassiveSkillId);
            if (skillPreset) {
                const skill = new Skill(skillPreset);
                character.skills[0] = skill; // 装备到第一个槽位
                console.log(`孵化时自动装备被动技能到技能槽1: ${skillPreset.name}`);
                
                // 孵化时装备技能后重新计算属性（重要！）
                character.updateAttributes();
            }
        }
        
        console.log('角色孵化完成，当前生命值已设置为最大生命值:', character.currentHealth);
        console.log('技能槽1已解锁并装备被动技能，技能槽位1（主动技能槽）已解锁');
    }
    
    // 喂食（增加饱腹度）
    feed(amount = 10) {
        this.attributes.satiety.current = Math.min(
            this.attributes.satiety.current + amount,
            this.attributes.satiety.max
        );
    }
    
    // 使用食物投喂
    feedWithFood(foodItem) {
        if (foodItem.type !== '食物') {
            return false;
        }
        
        // 检查饱腹度是否已满
        if (this.attributes.satiety.current >= this.attributes.satiety.max) {
            return false; // 饱腹度已满，无法投喂
        }
        
        // 根据食物类型应用不同效果
        switch(foodItem.name) {
            case '米饭':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 15,
                    this.attributes.satiety.max
                );
                break;
            case '牛奶':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.strength.current = Math.min(
                    this.attributes.strength.current + 1,
                    this.attributes.strength.max
                );
                break;
            case '番茄':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 1,
                    this.attributes.vitality.max
                );
                break;
            case '鸡腿':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 1,
                    this.attributes.cleverness.max
                );
                break;
            case '茶':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 1,
                    this.attributes.wisdom.max
                );
                break;
            case '肉排':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 2,
                    this.attributes.cleverness.max
                );
                break;
            case '香蕉':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 2,
                    this.attributes.vitality.max
                );
                break;
            case '冰淇淋':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.strength.current = Math.min(
                    this.attributes.strength.current + 2,
                    this.attributes.strength.max
                );
                break;
            case '啤酒':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 2,
                    this.attributes.wisdom.max
                );
                break;
            // 新基础食物
            case '胡萝卜':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 3,
                    this.attributes.satiety.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 1,
                    this.attributes.vitality.max
                );
                break;
            case '土豆':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 3,
                    this.attributes.satiety.max
                );
                this.attributes.strength.current = Math.min(
                    this.attributes.strength.current + 1,
                    this.attributes.strength.max
                );
                break;
            case '鱼':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 3,
                    this.attributes.satiety.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 1,
                    this.attributes.cleverness.max
                );
                break;
            case '蘑菇':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 3,
                    this.attributes.satiety.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 1,
                    this.attributes.wisdom.max
                );
                break;
            // 菜肴（饱腹值减少75%）
            case '烤鱼':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 3,
                    this.attributes.satiety.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 3,
                    this.attributes.cleverness.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 2,
                    this.attributes.vitality.max
                );
                break;
            case '蔬菜炖肉':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 4,
                    this.attributes.satiety.max
                );
                this.attributes.strength.current = Math.min(
                    this.attributes.strength.current + 3,
                    this.attributes.strength.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 3,
                    this.attributes.vitality.max
                );
                break;
            case '蘑菇汤':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 3,
                    this.attributes.satiety.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 4,
                    this.attributes.wisdom.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 2,
                    this.attributes.cleverness.max
                );
                break;
            case '烤鸡':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 4,
                    this.attributes.cleverness.max
                );
                this.attributes.strength.current = Math.min(
                    this.attributes.strength.current + 3,
                    this.attributes.strength.max
                );
                break;
            case '水果沙拉':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 3,
                    this.attributes.satiety.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 5,
                    this.attributes.vitality.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 2,
                    this.attributes.wisdom.max
                );
                break;
            case '海鲜拼盘':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 7,
                    this.attributes.satiety.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 5,
                    this.attributes.cleverness.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 4,
                    this.attributes.vitality.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 3,
                    this.attributes.wisdom.max
                );
                break;
            case '高级牛排':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 5,
                    this.attributes.satiety.max
                );
                this.attributes.strength.current = Math.min(
                    this.attributes.strength.current + 6,
                    this.attributes.strength.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 3,
                    this.attributes.cleverness.max
                );
                break;
            case '皇家盛宴':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 8,
                    this.attributes.satiety.max
                );
                this.attributes.strength.current = Math.min(
                    this.attributes.strength.current + 8,
                    this.attributes.strength.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 8,
                    this.attributes.vitality.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 8,
                    this.attributes.cleverness.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 8,
                    this.attributes.wisdom.max
                );
                break;
            case '龙肉火锅':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 9,
                    this.attributes.satiety.max
                );
                this.attributes.strength.current = Math.min(
                    this.attributes.strength.current + 10,
                    this.attributes.strength.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 10,
                    this.attributes.vitality.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 10,
                    this.attributes.cleverness.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 10,
                    this.attributes.wisdom.max
                );
                break;
            case '魔法蛋糕':
                this.attributes.satiety.current = Math.min(
                    this.attributes.satiety.current + 4,
                    this.attributes.satiety.max
                );
                this.attributes.wisdom.current = Math.min(
                    this.attributes.wisdom.current + 7,
                    this.attributes.wisdom.max
                );
                this.attributes.cleverness.current = Math.min(
                    this.attributes.cleverness.current + 4,
                    this.attributes.cleverness.max
                );
                this.attributes.vitality.current = Math.min(
                    this.attributes.vitality.current + 3,
                    this.attributes.vitality.max
                );
                break;
            default:
                return false;
        }
        
        return true;
    }
}

// 物品预设
class ItemPresets {
    static getPreset(presetName) {
        const presets = {
            dirty_egg: {
                name: "脏兮兮的蛋",
                type: "蛋",
                icon: "🥚",
                description: "有点臭臭的，会孵出什么呢？",
                effect: "暂无",
                buyPrice: 100,
                sellPrice: 10,
                rarity: "普通"
            },
            smooth_egg: {
                name: "光滑的蛋",
                type: "蛋",
                icon: "🥚",
                description: "表面光滑如镜，散发着神秘的光芒。",
                effect: "暂无",
                buyPrice: 500,
                sellPrice: 50,
                rarity: "稀有"
            },
            hard_egg: {
                name: "坚硬的蛋",
                type: "蛋",
                icon: "🥚",
                description: "坚硬如石，蕴含着强大的力量。",
                effect: "暂无",
                buyPrice: 2000,
                sellPrice: 200,
                rarity: "神话"
            },
            giant_egg: {
                name: "巨大的蛋",
                type: "蛋",
                icon: "🥚",
                description: "体积巨大，仿佛蕴含着传说中的生物。",
                effect: "暂无",
                buyPrice: 10000,
                sellPrice: 1000,
                rarity: "传说"
            },
            rice: {
                name: "米饭",
                type: "食物",
                icon: "🍚",
                description: "没什么营养，果腹足矣",
                effect: "饱腹🍽️+15",
                buyPrice: 5,
                sellPrice: 1,
                rarity: "普通"
            },
            milk: {
                name: "牛奶",
                type: "食物",
                icon: "🥛",
                description: "饱腹+5、强壮+1",
                effect: "饱腹🍽️+5、强壮💪+1",
                buyPrice: 25,
                sellPrice: 2,
                rarity: "普通"
            },
            tomato: {
                name: "番茄",
                type: "食物",
                icon: "🍅",
                description: "饱腹+5、活力+1",
                effect: "饱腹🍽️+5、活力⚡+1",
                buyPrice: 25,
                sellPrice: 2,
                rarity: "普通"
            },
            chicken_leg: {
                name: "鸡腿",
                type: "食物",
                icon: "🍗",
                description: "饱腹+5、机灵+1",
                effect: "饱腹🍽️+5、机灵🧠+1",
                buyPrice: 25,
                sellPrice: 2,
                rarity: "普通"
            },
            tea: {
                name: "茶",
                type: "食物",
                icon: "🍵",
                description: "饱腹+5、悟性+1",
                effect: "饱腹🍽️+5、悟性🔮+1",
                buyPrice: 25,
                sellPrice: 2,
                rarity: "普通"
            },
            steak: {
                name: "肉排",
                type: "食物",
                icon: "🥩",
                description: "饱腹🍽️+5、机灵🧠+2",
                effect: "饱腹🍽️+5、机灵🧠+2",
                buyPrice: 200,
                sellPrice: 20,
                rarity: "普通"
            },
            banana: {
                name: "香蕉",
                type: "食物",
                icon: "🍌",
                description: "饱腹🍽️+5、活力⚡+2",
                effect: "饱腹🍽️+5、活力⚡+2",
                buyPrice: 200,
                sellPrice: 20,
                rarity: "普通"
            },
            ice_cream: {
                name: "冰淇淋",
                type: "食物",
                icon: "🍨",
                description: "饱腹🍽️+5、强壮💪+2",
                effect: "饱腹🍽️+5、强壮💪+2",
                buyPrice: 200,
                sellPrice: 20,
                rarity: "普通"
            },
            beer: {
                name: "啤酒",
                type: "食物",
                icon: "🍺",
                description: "饱腹🍽️+5、悟性🔮+2",
                effect: "饱腹🍽️+5、悟性🔮+2",
                buyPrice: 200,
                sellPrice: 20,
                rarity: "普通"
            },
            carrot: {
                name: "胡萝卜",
                type: "食物",
                icon: "🥕",
                description: "饱腹🍽️+3、活力⚡+1",
                effect: "饱腹🍽️+3、活力⚡+1",
                buyPrice: 15,
                sellPrice: 1,
                rarity: "普通"
            },
            potato: {
                name: "土豆",
                type: "食物",
                icon: "🥔",
                description: "饱腹🍽️+3、强壮💪+1",
                effect: "饱腹🍽️+3、强壮💪+1",
                buyPrice: 15,
                sellPrice: 1,
                rarity: "普通"
            },
            fish: {
                name: "鱼",
                type: "食物",
                icon: "🐟",
                description: "饱腹🍽️+3、机灵🧠+1",
                effect: "饱腹🍽️+3、机灵🧠+1",
                buyPrice: 15,
                sellPrice: 1,
                rarity: "普通"
            },
            mushroom: {
                name: "蘑菇",
                type: "食物",
                icon: "🍄",
                description: "饱腹🍽️+3、悟性🔮+1",
                effect: "饱腹🍽️+3、悟性🔮+1",
                buyPrice: 15,
                sellPrice: 1,
                rarity: "普通"
            },
            // 种子物品
            carrot_seed: {
                name: "胡萝卜种子",
                type: "种子",
                icon: "🌱",
                description: "可以种植胡萝卜的种子",
                effect: "种植后300秒成熟，收获2-4个胡萝卜",
                buyPrice: 20,
                sellPrice: 5,
                rarity: "普通",
                growthTime: 300,
                harvestMin: 2,
                harvestMax: 4,
                cropId: "carrot",
                cropIcon: "🥕"
            },
            potato_seed: {
                name: "土豆种子",
                type: "种子",
                icon: "🌱",
                description: "可以种植土豆的种子",
                effect: "种植后300秒成熟，收获2-4个土豆",
                buyPrice: 20,
                sellPrice: 5,
                rarity: "普通",
                growthTime: 300,
                harvestMin: 2,
                harvestMax: 4,
                cropId: "potato",
                cropIcon: "🥔"
            },
            fish_seed: {
                name: "鱼苗",
                type: "种子",
                icon: "🐠",
                description: "可以养殖鱼的鱼苗",
                effect: "养殖后300秒成熟，收获2-4条鱼",
                buyPrice: 20,
                sellPrice: 5,
                rarity: "普通",
                growthTime: 300,
                harvestMin: 2,
                harvestMax: 4,
                cropId: "fish",
                cropIcon: "🐟"
            },
            mushroom_seed: {
                name: "蘑菇孢子",
                type: "种子",
                icon: "🍄",
                description: "可以种植蘑菇的孢子",
                effect: "种植后300秒成熟，收获2-4个蘑菇",
                buyPrice: 20,
                sellPrice: 5,
                rarity: "普通",
                growthTime: 300,
                harvestMin: 2,
                harvestMax: 4,
                cropId: "mushroom",
                cropIcon: "🍄"
            },
            tomato_seed: {
                name: "番茄种子",
                type: "种子",
                icon: "🌱",
                description: "可以种植番茄的种子",
                effect: "种植后300秒成熟，收获2-4个番茄",
                buyPrice: 25,
                sellPrice: 6,
                rarity: "普通",
                growthTime: 300,
                harvestMin: 2,
                harvestMax: 4,
                cropId: "tomato",
                cropIcon: "🍅"
            },
            banana_seed: {
                name: "香蕉种子",
                type: "种子",
                icon: "🌱",
                description: "可以种植香蕉的种子",
                effect: "种植后300秒成熟，收获2-4个香蕉",
                buyPrice: 50,
                sellPrice: 12,
                rarity: "稀有",
                growthTime: 300,
                harvestMin: 2,
                harvestMax: 4,
                cropId: "banana",
                cropIcon: "🍌"
            },
            tea_seed: {
                name: "茶叶种子",
                type: "种子",
                icon: "🌱",
                description: "可以种植茶叶的种子",
                effect: "种植后300秒成熟，收获2-4份茶叶",
                buyPrice: 30,
                sellPrice: 7,
                rarity: "普通",
                growthTime: 300,
                harvestMin: 2,
                harvestMax: 4,
                cropId: "tea",
                cropIcon: "🍵"
            },
            // 菜肴预制体 - 高级食物
            grilled_fish: {
                name: "烤鱼",
                type: "食物",
                icon: "🍖",
                description: "美味的烤鱼，饱腹🍽️+3、机灵🧠+3、活力⚡+2",
                effect: "饱腹🍽️+3、机灵🧠+3、活力⚡+2",
                buyPrice: 150,
                sellPrice: 30,
                rarity: "稀有",
                isCuisine: true
            },
            vegetable_stew: {
                name: "蔬菜炖肉",
                type: "食物",
                icon: "🍲",
                description: "营养丰富的炖菜，饱腹🍽️+4、强壮💪+3、活力⚡+3",
                effect: "饱腹🍽️+4、强壮💪+3、活力⚡+3",
                buyPrice: 200,
                sellPrice: 40,
                rarity: "稀有",
                isCuisine: true
            },
            mushroom_soup: {
                name: "蘑菇汤",
                type: "食物",
                icon: "🥣",
                description: "香浓的蘑菇汤，饱腹🍽️+3、悟性🔮+4、机灵🧠+2",
                effect: "饱腹🍽️+3、悟性🔮+4、机灵🧠+2",
                buyPrice: 180,
                sellPrice: 36,
                rarity: "稀有",
                isCuisine: true
            },
            roasted_chicken: {
                name: "烤鸡",
                type: "食物",
                icon: "🍗",
                description: "金黄酥脆的烤鸡，饱腹🍽️+5、机灵🧠+4、强壮💪+3",
                effect: "饱腹🍽️+5、机灵🧠+4、强壮💪+3",
                buyPrice: 250,
                sellPrice: 50,
                rarity: "稀有",
                isCuisine: true
            },
            fruit_salad: {
                name: "水果沙拉",
                type: "食物",
                icon: "🥗",
                description: "新鲜的水果沙拉，饱腹🍽️+3、活力⚡+5、悟性🔮+2",
                effect: "饱腹🍽️+3、活力⚡+5、悟性🔮+2",
                buyPrice: 160,
                sellPrice: 32,
                rarity: "稀有",
                isCuisine: true
            },
            seafood_platter: {
                name: "海鲜拼盘",
                type: "食物",
                icon: "🦞",
                description: "豪华的海鲜大餐，饱腹🍽️+7、机灵🧠+5、活力⚡+4、悟性🔮+3",
                effect: "饱腹🍽️+7、机灵🧠+5、活力⚡+4、悟性🔮+3",
                buyPrice: 400,
                sellPrice: 80,
                rarity: "神话",
                isCuisine: true
            },
            premium_steak: {
                name: "高级牛排",
                type: "食物",
                icon: "🥩",
                description: "完美烹制的牛排，饱腹🍽️+5、强壮💪+6、机灵🧠+3",
                effect: "饱腹🍽️+5、强壮💪+6、机灵🧠+3",
                buyPrice: 350,
                sellPrice: 70,
                rarity: "神话",
                isCuisine: true
            },
            royal_feast: {
                name: "皇家盛宴",
                type: "食物",
                icon: "🍱",
                description: "奢华的皇家料理，饱腹🍽️+8、强壮💪+8、活力⚡+8、机灵🧠+8、悟性🔮+8",
                effect: "饱腹🍽️+8、强壮💪+8、活力⚡+8、机灵🧠+8、悟性🔮+8",
                buyPrice: 800,
                sellPrice: 160,
                rarity: "传说",
                isCuisine: true
            },
            dragon_hotpot: {
                name: "龙肉火锅",
                type: "食物",
                icon: "🍲",
                description: "传说中的龙肉料理，饱腹🍽️+9、强壮💪+10、活力⚡+10、机灵🧠+10、悟性🔮+10",
                effect: "饱腹🍽️+9、强壮💪+10、活力⚡+10、机灵🧠+10、悟性🔮+10",
                buyPrice: 1000,
                sellPrice: 200,
                rarity: "传说",
                isCuisine: true
            },
            magic_cake: {
                name: "魔法蛋糕",
                type: "食物",
                icon: "🎂",
                description: "充满魔力的甜点，饱腹🍽️+4、悟性🔮+7、机灵🧠+4、活力⚡+3",
                effect: "饱腹🍽️+4、悟性🔮+7、机灵🧠+4、活力⚡+3",
                buyPrice: 300,
                sellPrice: 60,
                rarity: "神话",
                isCuisine: true
            },
            bandage: {
                name: "绷带",
                type: "消耗品",
                icon: "🩹",
                description: "能恢复少量生命值，建议常备。",
                effect: "恢复20点生命值",
                targetRequirement: "当前生命值＞1",
                buyPrice: 50,
                sellPrice: 5,
                rarity: "普通"
            },
            mana_capsule: {
                name: "魔力胶囊",
                type: "消耗品",
                icon: "💊",
                description: "能恢复魔法值，建议常备。",
                effect: "恢复100点魔法值",
                targetRequirement: "当前生命值＞1",
                buyPrice: 100,
                sellPrice: 10,
                rarity: "普通"
            },
            herb_potion: {
                name: "香草药剂",
                type: "消耗品",
                icon: "🧪",
                description: "可以用来恢复生命值",
                effect: "选择一名玩家角色进行治疗，治疗量为：15+该角色最大生命值20%",
                targetRequirement: "当前生命值＞1",
                buyPrice: 80,
                sellPrice: 8,
                rarity: "普通"
            },
            experience_note: {
                name: "经验笔记",
                type: "消耗品",
                icon: "📜",
                description: "能让角色获得经验值",
                effect: "选择一个玩家角色，使其增加经验值，增加的数值为：50+角色最大经验值25%",
                targetRequirement: "当前生命值＞1",
                buyPrice: 100,
                sellPrice: 10,
                rarity: "普通"
            },
            savage_charge_book: {
                name: "《野蛮冲锋》技能书",
                type: "书",
                icon: "📕",
                description: "可以使角色习得技能：野蛮冲锋",
                effect: "使角色获得野蛮冲锋技能",
                skillId: "savage_charge",
                buyPrice: 500,
                sellPrice: 50,
                rarity: "稀有"
            },
            heavy_punch_book: {
                name: "《重拳出击》技能书",
                type: "书",
                icon: "📕",
                description: "可以使角色习得技能：重拳出击",
                effect: "使角色获得重拳出击技能",
                skillId: "heavy_punch",
                buyPrice: 500,
                sellPrice: 50,
                rarity: "稀有"
            },
            emergency_bandage_book: {
                name: "《紧急包扎》技能书",
                type: "书",
                icon: "📕",
                description: "可以使角色习得技能：紧急包扎",
                effect: "使角色获得紧急包扎技能",
                skillId: "emergency_bandage",
                buyPrice: 500,
                sellPrice: 50,
                rarity: "稀有"
            },
            enrage_book: {
                name: "《激怒》技能书",
                type: "书",
                icon: "📕",
                description: "可以使角色习得技能：激怒",
                effect: "使角色获得激怒技能",
                skillId: "enrage",
                buyPrice: 500,
                sellPrice: 50,
                rarity: "稀有"
            },
            flying_daggers_book: {
                name: "《飞刀射击》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"飞刀射击\"",
                effect: "使角色获得飞刀射击技能",
                skillId: "flying_daggers",
                buyPrice: 600,
                sellPrice: 60,
                rarity: "稀有"
            },
            fireball_book: {
                name: "《火球术》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"火球术\"",
                effect: "使角色获得火球术技能",
                skillId: "fireball",
                buyPrice: 650,
                sellPrice: 65,
                rarity: "稀有"
            },
            lightning_strike_book: {
                name: "《雷击术》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"雷击术\"",
                effect: "使角色获得雷击术技能",
                skillId: "lightning_strike",
                buyPrice: 550,
                sellPrice: 55,
                rarity: "稀有"
            },
            spike_trap_book: {
                name: "《尖刺陷阱》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"尖刺陷阱\"",
                effect: "使角色获得尖刺陷阱技能",
                skillId: "spike_trap",
                buyPrice: 700,
                sellPrice: 70,
                rarity: "稀有"
            },
            whirlwind_axe_book: {
                name: "《旋风飞斧》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"旋风飞斧\"",
                effect: "使角色获得旋风飞斧技能",
                skillId: "whirlwind_axe",
                buyPrice: 575,
                sellPrice: 57,
                rarity: "稀有"
            },
            soothing_heal_book: {
                name: "《舒缓治疗》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"舒缓治疗\"",
                effect: "使角色获得舒缓治疗技能",
                skillId: "soothing_heal",
                buyPrice: 625,
                sellPrice: 62,
                rarity: "稀有"
            },
            rush_book: {
                name: "《奔腾》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"奔腾\"",
                effect: "使角色获得奔腾技能",
                skillId: "rush",
                buyPrice: 750,
                sellPrice: 75,
                rarity: "稀有"
            },
            magic_barrier_book: {
                name: "《魔法屏障》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"魔法屏障\"",
                effect: "使角色获得魔法屏障技能",
                skillId: "magic_barrier",
                buyPrice: 800,
                sellPrice: 80,
                rarity: "稀有"
            },
            stomp_book: {
                name: "《践踏》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"践踏\"",
                effect: "使角色获得践踏技能",
                skillId: "stomp",
                buyPrice: 675,
                sellPrice: 67,
                rarity: "稀有"
            },
            weakness_curse_book: {
                name: "《虚弱诅咒》技能书",
                type: "书",
                icon: "📕",
                description: "使一名角色习得技能\"虚弱诅咒\"",
                effect: "使角色获得虚弱诅咒技能",
                skillId: "weakness_curse",
                buyPrice: 725,
                sellPrice: 72,
                rarity: "稀有"
            },
            copper_ore: {
                name: "铜矿石",
                type: "材料",
                icon: "⛰️",
                description: "很常见的矿物，适合用来制作各种物品，也可以用来出售。",
                effect: "暂无",
                buyPrice: 100,
                sellPrice: 10,
                rarity: "普通"
            },
            oak_wood: {
                name: "橡木材",
                type: "材料",
                icon: "🌳",
                description: "十分结实的木材，适合用来制作各种物品，也可以用来出售。",
                effect: "暂无",
                buyPrice: 100,
                sellPrice: 10,
                rarity: "普通"
            },
            herb_leaf: {
                name: "香草叶",
                type: "材料",
                icon: "🌿",
                description: "闻上去香香的，适合用来制作食物和药剂，也可以用来出售。",
                effect: "暂无",
                buyPrice: 100,
                sellPrice: 10,
                rarity: "普通"
            },
            // 装备预制体
            copper_sword: {
                name: "铜剑",
                type: "装备",
                equipmentType: "武器",
                icon: "🗡",
                description: "用铜制作的基础武器，虽然简陋但很实用。",
                effect: "无",
                quality: "普通",
                qualityColor: "white",
                mainAffix: "3攻击力", // 主词条
                buyPrice: 500,
                sellPrice: 50,
                rarity: "普通"
            },
            copper_shield: {
                name: "铜盾牌",
                type: "装备",
                equipmentType: "副手",
                icon: "🛡️",
                description: "用铜制作的基础盾牌，能提供一定的防护。",
                effect: "无",
                quality: "普通",
                qualityColor: "white",
                mainAffix: "5防御力", // 主词条
                buyPrice: 500,
                sellPrice: 50,
                rarity: "普通"
            },
            copper_chestplate: {
                name: "铜甲护胸",
                type: "装备",
                equipmentType: "护甲",
                icon: "🦺",
                description: "用铜制作的基础护甲，能保护胸部要害。",
                effect: "无",
                quality: "普通",
                qualityColor: "white",
                mainAffix: "3防御力、10最大生命值", // 主词条
                buyPrice: 500,
                sellPrice: 50,
                rarity: "普通"
            },
            copper_ring: {
                name: "铜戒指",
                type: "装备",
                equipmentType: "杂项",
                icon: "💍",
                description: "用铜制作的简单戒指，朴素而实用。",
                effect: "无",
                quality: "普通",
                qualityColor: "white",
                mainAffix: "1防御力", // 主词条
                buyPrice: 500,
                sellPrice: 50,
                rarity: "普通"
            }
        };
        
        return presets[presetName] || presets.dirty_egg;
    }
}

// 词条预制体库
class AffixPresets {
    static getPreset(presetName) {
        const presets = {
            // 锋利系列 - 攻击力
            low_sharpness: {
                name: "低级锋利",
                attribute: "attackPower",
                minValue: 1,
                maxValue: 5,
                rarity: "普通"
            },
            mid_sharpness: {
                name: "中级锋利",
                attribute: "attackPower",
                minValue: 1,
                maxValue: 10,
                rarity: "稀有"
            },
            high_sharpness: {
                name: "高级锋利",
                attribute: "attackPower",
                minValue: 1,
                maxValue: 20,
                rarity: "神话"
            },
            legendary_sharpness: {
                name: "特级锋利",
                attribute: "attackPower",
                minValue: 10,
                maxValue: 50,
                rarity: "传说"
            },
            
            // 牢固系列 - 防御力
            low_sturdy: {
                name: "低级牢固",
                attribute: "defense",
                minValue: 1,
                maxValue: 5,
                rarity: "普通"
            },
            mid_sturdy: {
                name: "中级牢固",
                attribute: "defense",
                minValue: 1,
                maxValue: 10,
                rarity: "稀有"
            },
            high_sturdy: {
                name: "高级牢固",
                attribute: "defense",
                minValue: 1,
                maxValue: 20,
                rarity: "神话"
            },
            legendary_sturdy: {
                name: "特级牢固",
                attribute: "defense",
                minValue: 10,
                maxValue: 50,
                rarity: "传说"
            },
            
            // 耐久系列 - 最大生命值
            low_endurance: {
                name: "低级耐久",
                attribute: "maxHealth",
                minValue: 1,
                maxValue: 10,
                rarity: "普通"
            },
            mid_endurance: {
                name: "中级耐久",
                attribute: "maxHealth",
                minValue: 1,
                maxValue: 20,
                rarity: "稀有"
            },
            high_endurance: {
                name: "高级耐久",
                attribute: "maxHealth",
                minValue: 1,
                maxValue: 40,
                rarity: "神话"
            },
            legendary_endurance: {
                name: "特级耐久",
                attribute: "maxHealth",
                minValue: 10,
                maxValue: 100,
                rarity: "传说"
            },
            
            // 健步系列 - 移动速度
            low_swift: {
                name: "低级健步",
                attribute: "moveSpeed",
                minValue: 1,
                maxValue: 5,
                rarity: "普通"
            },
            mid_swift: {
                name: "中级健步",
                attribute: "moveSpeed",
                minValue: 1,
                maxValue: 10,
                rarity: "稀有"
            },
            high_swift: {
                name: "高级健步",
                attribute: "moveSpeed",
                minValue: 1,
                maxValue: 20,
                rarity: "神话"
            },
            legendary_swift: {
                name: "特级健步",
                attribute: "moveSpeed",
                minValue: 10,
                maxValue: 50,
                rarity: "传说"
            },
            
            // 顽强系列 - 生命恢复速度
            low_tenacious: {
                name: "低级顽强",
                attribute: "healthRegen",
                minValue: 0.1,
                maxValue: 0.3,
                rarity: "普通"
            },
            mid_tenacious: {
                name: "中级顽强",
                attribute: "healthRegen",
                minValue: 0.1,
                maxValue: 0.6,
                rarity: "稀有"
            },
            high_tenacious: {
                name: "高级顽强",
                attribute: "healthRegen",
                minValue: 0.1,
                maxValue: 0.9,
                rarity: "神话"
            },
            legendary_tenacious: {
                name: "特级顽强",
                attribute: "healthRegen",
                minValue: 0.1,
                maxValue: 1.2,
                rarity: "传说"
            },
            
            // 充沛系列 - 魔法恢复速度
            low_abundant: {
                name: "低级充沛",
                attribute: "manaRegen",
                minValue: 0.2,
                maxValue: 0.6,
                rarity: "普通"
            },
            mid_abundant: {
                name: "中级充沛",
                attribute: "manaRegen",
                minValue: 0.2,
                maxValue: 1.2,
                rarity: "稀有"
            },
            high_abundant: {
                name: "高级充沛",
                attribute: "manaRegen",
                minValue: 0.2,
                maxValue: 1.8,
                rarity: "神话"
            },
            legendary_abundant: {
                name: "特级充沛",
                attribute: "manaRegen",
                minValue: 0.6,
                maxValue: 3,
                rarity: "传说"
            },
            
            // 成长系列 - 经验值获取量
            low_growth: {
                name: "低级成长",
                attribute: "expGain",
                minValue: 1,
                maxValue: 5,
                rarity: "普通"
            },
            mid_growth: {
                name: "中级成长",
                attribute: "expGain",
                minValue: 1,
                maxValue: 10,
                rarity: "稀有"
            },
            high_growth: {
                name: "高级成长",
                attribute: "expGain",
                minValue: 1,
                maxValue: 20,
                rarity: "神话"
            },
            legendary_growth: {
                name: "特级成长",
                attribute: "expGain",
                minValue: 5,
                maxValue: 50,
                rarity: "传说"
            },
            
            // 力量强化系列
            low_strength: {
                name: "低级力量强化",
                attribute: "strength",
                minValue: 1,
                maxValue: 3,
                rarity: "普通"
            },
            mid_strength: {
                name: "中级力量强化",
                attribute: "strength",
                minValue: 1,
                maxValue: 6,
                rarity: "稀有"
            },
            high_strength: {
                name: "高级力量强化",
                attribute: "strength",
                minValue: 1,
                maxValue: 9,
                rarity: "神话"
            },
            legendary_strength: {
                name: "特级力量强化",
                attribute: "strength",
                minValue: 3,
                maxValue: 15,
                rarity: "传说"
            },
            
            // 敏捷强化系列
            low_agility: {
                name: "低级敏捷强化",
                attribute: "agility",
                minValue: 1,
                maxValue: 3,
                rarity: "普通"
            },
            mid_agility: {
                name: "中级敏捷强化",
                attribute: "agility",
                minValue: 1,
                maxValue: 6,
                rarity: "稀有"
            },
            high_agility: {
                name: "高级敏捷强化",
                attribute: "agility",
                minValue: 1,
                maxValue: 9,
                rarity: "神话"
            },
            legendary_agility: {
                name: "特级敏捷强化",
                attribute: "agility",
                minValue: 3,
                maxValue: 15,
                rarity: "传说"
            },
            
            // 智慧强化系列
            low_intelligence: {
                name: "低级智慧强化",
                attribute: "intelligence",
                minValue: 1,
                maxValue: 3,
                rarity: "普通"
            },
            mid_intelligence: {
                name: "中级智慧强化",
                attribute: "intelligence",
                minValue: 1,
                maxValue: 6,
                rarity: "稀有"
            },
            high_intelligence: {
                name: "高级智慧强化",
                attribute: "intelligence",
                minValue: 1,
                maxValue: 9,
                rarity: "神话"
            },
            legendary_intelligence: {
                name: "特级智慧强化",
                attribute: "intelligence",
                minValue: 3,
                maxValue: 15,
                rarity: "传说"
            },
            
            // 技巧强化系列
            low_skill: {
                name: "低级技巧强化",
                attribute: "skill",
                minValue: 1,
                maxValue: 3,
                rarity: "普通"
            },
            mid_skill: {
                name: "中级技巧强化",
                attribute: "skill",
                minValue: 1,
                maxValue: 6,
                rarity: "稀有"
            },
            high_skill: {
                name: "高级技巧强化",
                attribute: "skill",
                minValue: 1,
                maxValue: 9,
                rarity: "神话"
            },
            legendary_skill: {
                name: "特级技巧强化",
                attribute: "skill",
                minValue: 3,
                maxValue: 15,
                rarity: "传说"
            }
        };
        
        return presets[presetName] || null;
    }
    
    // 获取所有词条ID列表
    static getAllAffixIds() {
        return [
            'low_sharpness', 'mid_sharpness', 'high_sharpness', 'legendary_sharpness',
            'low_sturdy', 'mid_sturdy', 'high_sturdy', 'legendary_sturdy',
            'low_endurance', 'mid_endurance', 'high_endurance', 'legendary_endurance',
            'low_swift', 'mid_swift', 'high_swift', 'legendary_swift',
            'low_tenacious', 'mid_tenacious', 'high_tenacious', 'legendary_tenacious',
            'low_abundant', 'mid_abundant', 'high_abundant', 'legendary_abundant',
            'low_growth', 'mid_growth', 'high_growth', 'legendary_growth',
            'low_strength', 'mid_strength', 'high_strength', 'legendary_strength',
            'low_agility', 'mid_agility', 'high_agility', 'legendary_agility',
            'low_intelligence', 'mid_intelligence', 'high_intelligence', 'legendary_intelligence',
            'low_skill', 'mid_skill', 'high_skill', 'legendary_skill'
        ];
    }
    
    // 获取所有词条按稀有度分类
    static getAffixesByRarity() {
        const allAffixes = this.getAllAffixIds();
        const rarityGroups = {
            "普通": [],
            "稀有": [],
            "神话": [],
            "传说": []
        };
        
        allAffixes.forEach(affixId => {
            const affix = this.getPreset(affixId);
            if (affix) {
                rarityGroups[affix.rarity].push(affixId);
            }
        });
        
        return rarityGroups;
    }
    
    // 根据装备稀有度获取词条稀有度权重
    static getAffixRarityWeights(equipmentRarity) {
        const weights = {
            "普通": { "普通": 90, "稀有": 10, "神话": 0, "传说": 0 },
            "稀有": { "普通": 5, "稀有": 85, "神话": 10, "传说": 0 },
            "神话": { "普通": 5, "稀有": 5, "神话": 80, "传说": 10 },
            "传说": { "普通": 0, "稀有": 5, "神话": 45, "传说": 50 }
        };
        
        return weights[equipmentRarity] || weights["普通"];
    }
    
    // 根据词条名称和稀有度获取词条预制体（用于获取数值范围）
    static getPresetByNameAndRarity(affixName, rarity) {
        // 遍历所有预制体找到匹配的
        const allPresets = this.getAllPresets();
        for (const [key, preset] of Object.entries(allPresets)) {
            if (preset.name === affixName && preset.rarity === rarity) {
                return preset;
            }
        }
        
        return null;
    }
    
    // 获取所有预制体（内部方法）
    static getAllPresets() {
        return {
            // 锋利系列 - 攻击力
            low_sharpness: {
                name: "低级锋利",
                attribute: "attackPower",
                minValue: 1,
                maxValue: 5,
                rarity: "普通"
            },
            mid_sharpness: {
                name: "中级锋利",
                attribute: "attackPower",
                minValue: 1,
                maxValue: 10,
                rarity: "稀有"
            },
            high_sharpness: {
                name: "高级锋利",
                attribute: "attackPower",
                minValue: 1,
                maxValue: 20,
                rarity: "神话"
            },
            legendary_sharpness: {
                name: "特级锋利",
                attribute: "attackPower",
                minValue: 10,
                maxValue: 50,
                rarity: "传说"
            },
            
            // 牢固系列 - 防御力
            low_sturdy: {
                name: "低级牢固",
                attribute: "defense",
                minValue: 1,
                maxValue: 5,
                rarity: "普通"
            },
            mid_sturdy: {
                name: "中级牢固",
                attribute: "defense",
                minValue: 1,
                maxValue: 10,
                rarity: "稀有"
            },
            high_sturdy: {
                name: "高级牢固",
                attribute: "defense",
                minValue: 1,
                maxValue: 20,
                rarity: "神话"
            },
            legendary_sturdy: {
                name: "特级牢固",
                attribute: "defense",
                minValue: 10,
                maxValue: 50,
                rarity: "传说"
            },
            
            // 耐久系列 - 最大生命值
            low_endurance: {
                name: "低级耐久",
                attribute: "maxHealth",
                minValue: 1,
                maxValue: 10,
                rarity: "普通"
            },
            mid_endurance: {
                name: "中级耐久",
                attribute: "maxHealth",
                minValue: 1,
                maxValue: 20,
                rarity: "稀有"
            },
            high_endurance: {
                name: "高级耐久",
                attribute: "maxHealth",
                minValue: 1,
                maxValue: 40,
                rarity: "神话"
            },
            legendary_endurance: {
                name: "特级耐久",
                attribute: "maxHealth",
                minValue: 10,
                maxValue: 100,
                rarity: "传说"
            },
            
            // 健步系列 - 移动速度
            low_swift: {
                name: "低级健步",
                attribute: "moveSpeed",
                minValue: 1,
                maxValue: 5,
                rarity: "普通"
            },
            mid_swift: {
                name: "中级健步",
                attribute: "moveSpeed",
                minValue: 1,
                maxValue: 10,
                rarity: "稀有"
            },
            high_swift: {
                name: "高级健步",
                attribute: "moveSpeed",
                minValue: 1,
                maxValue: 20,
                rarity: "神话"
            },
            legendary_swift: {
                name: "特级健步",
                attribute: "moveSpeed",
                minValue: 10,
                maxValue: 50,
                rarity: "传说"
            },
            
            // 顽强系列 - 生命恢复速度
            low_tenacious: {
                name: "低级顽强",
                attribute: "healthRegen",
                minValue: 0.1,
                maxValue: 0.3,
                rarity: "普通"
            },
            mid_tenacious: {
                name: "中级顽强",
                attribute: "healthRegen",
                minValue: 0.1,
                maxValue: 0.6,
                rarity: "稀有"
            },
            high_tenacious: {
                name: "高级顽强",
                attribute: "healthRegen",
                minValue: 0.1,
                maxValue: 0.9,
                rarity: "神话"
            },
            legendary_tenacious: {
                name: "特级顽强",
                attribute: "healthRegen",
                minValue: 0.1,
                maxValue: 1.2,
                rarity: "传说"
            },
            
            // 充沛系列 - 魔法恢复速度
            low_abundant: {
                name: "低级充沛",
                attribute: "manaRegen",
                minValue: 0.2,
                maxValue: 0.6,
                rarity: "普通"
            },
            mid_abundant: {
                name: "中级充沛",
                attribute: "manaRegen",
                minValue: 0.2,
                maxValue: 1.2,
                rarity: "稀有"
            },
            high_abundant: {
                name: "高级充沛",
                attribute: "manaRegen",
                minValue: 0.2,
                maxValue: 1.8,
                rarity: "神话"
            },
            legendary_abundant: {
                name: "特级充沛",
                attribute: "manaRegen",
                minValue: 0.6,
                maxValue: 3,
                rarity: "传说"
            },
            
            // 成长系列 - 经验值获取量
            low_growth: {
                name: "低级成长",
                attribute: "expGain",
                minValue: 1,
                maxValue: 5,
                rarity: "普通"
            },
            mid_growth: {
                name: "中级成长",
                attribute: "expGain",
                minValue: 1,
                maxValue: 10,
                rarity: "稀有"
            },
            high_growth: {
                name: "高级成长",
                attribute: "expGain",
                minValue: 1,
                maxValue: 20,
                rarity: "神话"
            },
            legendary_growth: {
                name: "特级成长",
                attribute: "expGain",
                minValue: 5,
                maxValue: 50,
                rarity: "传说"
            },
            
            // 力量强化系列
            low_strength: {
                name: "低级力量强化",
                attribute: "strength",
                minValue: 1,
                maxValue: 3,
                rarity: "普通"
            },
            mid_strength: {
                name: "中级力量强化",
                attribute: "strength",
                minValue: 1,
                maxValue: 6,
                rarity: "稀有"
            },
            high_strength: {
                name: "高级力量强化",
                attribute: "strength",
                minValue: 1,
                maxValue: 9,
                rarity: "神话"
            },
            legendary_strength: {
                name: "特级力量强化",
                attribute: "strength",
                minValue: 3,
                maxValue: 15,
                rarity: "传说"
            },
            
            // 敏捷强化系列
            low_agility: {
                name: "低级敏捷强化",
                attribute: "agility",
                minValue: 1,
                maxValue: 3,
                rarity: "普通"
            },
            mid_agility: {
                name: "中级敏捷强化",
                attribute: "agility",
                minValue: 1,
                maxValue: 6,
                rarity: "稀有"
            },
            high_agility: {
                name: "高级敏捷强化",
                attribute: "agility",
                minValue: 1,
                maxValue: 9,
                rarity: "神话"
            },
            legendary_agility: {
                name: "特级敏捷强化",
                attribute: "agility",
                minValue: 3,
                maxValue: 15,
                rarity: "传说"
            },
            
            // 智慧强化系列
            low_intelligence: {
                name: "低级智慧强化",
                attribute: "intelligence",
                minValue: 1,
                maxValue: 3,
                rarity: "普通"
            },
            mid_intelligence: {
                name: "中级智慧强化",
                attribute: "intelligence",
                minValue: 1,
                maxValue: 6,
                rarity: "稀有"
            },
            high_intelligence: {
                name: "高级智慧强化",
                attribute: "intelligence",
                minValue: 1,
                maxValue: 9,
                rarity: "神话"
            },
            legendary_intelligence: {
                name: "特级智慧强化",
                attribute: "intelligence",
                minValue: 3,
                maxValue: 15,
                rarity: "传说"
            },
            
            // 技巧强化系列
            low_skill: {
                name: "低级技巧强化",
                attribute: "skill",
                minValue: 1,
                maxValue: 3,
                rarity: "普通"
            },
            mid_skill: {
                name: "中级技巧强化",
                attribute: "skill",
                minValue: 1,
                maxValue: 6,
                rarity: "稀有"
            },
            high_skill: {
                name: "高级技巧强化",
                attribute: "skill",
                minValue: 1,
                maxValue: 9,
                rarity: "神话"
            },
            legendary_skill: {
                name: "特级技巧强化",
                attribute: "skill",
                minValue: 3,
                maxValue: 15,
                rarity: "传说"
            }
        };
    }
}

// 敌人类
class Enemy {
    constructor(data) {
        this.name = data.name;
        this.icon = data.icon;
        this.level = data.level || 1;
        this.threatLevel = data.threatLevel || 0; // 威胁度
        this.maxHealth = data.maxHealth || 50;
        this.currentHealth = data.currentHealth || this.maxHealth;
        this.maxMana = data.maxMana || 100;
        this.currentMana = data.currentMana || 0;
        this.attackPower = data.attackPower || 10;
        this.defense = data.defense || 1;
        this.moveSpeed = data.moveSpeed || 5;
        this.manaRegen = data.manaRegen || 0.1; // 魔法恢复速度/秒
        this.weight = data.weight || 20;
        this.volume = data.volume || 100;
        this.skills = data.skills || []; // 技能列表
        this.equipment = data.equipment || {}; // 装备
        this.statusEffects = []; // 状态效果列表
        
        // 位置和移动相关属性
        this.x = 0;
        this.y = 0;
        this.radius = 25; // 圆形半径
        this.directionX = 0; // X方向移动向量
        this.directionY = 0; // Y方向移动向量
        this.finalMoveSpeed = 0; // 最终移动速度
        
        // 无敌系统
        this.isInvincible = false; // 是否处于无敌状态
        this.invincibilityEndTime = 0; // 无敌结束时间
    }
    
    // 添加状态效果
    addStatusEffect(effect) {
        if (!this.statusEffects) {
            this.statusEffects = [];
        }
        
        // 检查是否已有相同ID的状态效果
        const existingIndex = this.statusEffects.findIndex(e => e.id === effect.id);
        if (existingIndex !== -1) {
            // 如果已存在，替换为新的效果（刷新持续时间）
            this.statusEffects[existingIndex] = effect;
        } else {
            // 否则添加新效果
            this.statusEffects.push(effect);
        }
        
        // 初始化效果的计时器
        if (!effect.startTime) {
            effect.startTime = Date.now();
        }
        if (effect.tickInterval && !effect.lastTickTime) {
            effect.lastTickTime = Date.now();
        }
    }
    
    // 更新状态效果
    updateStatusEffects(game) {
        if (!this.statusEffects || this.statusEffects.length === 0) return;
        
        const currentTime = Date.now();
        
        // 从后往前遍历，方便删除过期效果
        for (let i = this.statusEffects.length - 1; i >= 0; i--) {
            const effect = this.statusEffects[i];
            
            // 检查效果是否过期
            if (currentTime - effect.startTime >= effect.duration) {
                this.statusEffects.splice(i, 1);
                continue;
            }
            
            // 处理持续伤害效果（如燃烧）
            if (effect.damagePerTick && effect.tickInterval) {
                if (currentTime - effect.lastTickTime >= effect.tickInterval) {
                    // 造成持续伤害
                    const actualDamage = this.takeDamage(effect.damagePerTick);
                    
                    // 显示伤害数字
                    if (game && game.showDamageNumber) {
                        game.showDamageNumber(this.x, this.y - this.radius - 10, actualDamage, 'burning');
                    }
                    
                    // 更新上次触发时间
                    effect.lastTickTime = currentTime;
                    
                    // 检查敌人是否死亡
                    if (this.currentHealth <= 0 && game && game.handleEnemyDeath && effect.source) {
                        game.handleEnemyDeath(this, effect.source);
                    }
                }
            }
        }
    }
    
    // 获取威胁度颜色
    getThreatColor() {
        const colors = {
            0: '#28A745', // 绿色 - 无威胁
            1: '#FFC107', // 黄色 - 低威胁
            2: '#FD7E14', // 橙色 - 中威胁
            3: '#DC3545', // 红色 - 高威胁
            4: '#6F42C1'  // 紫色 - 极高威胁
        };
        return colors[this.threatLevel] || colors[0];
    }
    
    // 获取威胁度文本
    getThreatText() {
        const threats = {
            0: '无威胁',
            1: '低威胁',
            2: '中威胁',
            3: '高威胁',
            4: '极高威胁'
        };
        return threats[this.threatLevel] || threats[0];
    }
    
    // 检查是否存活
    isAlive() {
        return this.currentHealth > 0;
    }
    
    // 受到伤害
    takeDamage(damage) {
        // 如果处于无敌状态，免疫伤害
        if (this.isCurrentlyInvincible()) {
            return 0;
        }
        
        const actualDamage = Math.max(1, damage - this.defense);
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        
        // 玩家角色受伤后获得0.5秒无敌效果
        if (this.type === 'Player') {
            this.setInvincible(500); // 0.5秒 = 500毫秒
        }
        
        return actualDamage;
    }
    
    // 恢复生命值
    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
    
    // 恢复魔法值
    restoreMana(amount) {
        this.currentMana = Math.min(this.maxMana, this.currentMana + amount);
    }
    
    // 设置无敌状态
    setInvincible(duration) {
        this.isInvincible = true;
        this.invincibilityEndTime = Date.now() + duration;
    }
    
    // 更新无敌状态
    updateInvincibility() {
        if (this.isInvincible && Date.now() >= this.invincibilityEndTime) {
            this.isInvincible = false;
        }
    }
    
    // 检查是否处于无敌状态
    isCurrentlyInvincible() {
        this.updateInvincibility();
        return this.isInvincible;
    }
}

// 敌人预设
class EnemyPresets {
    static getPreset(presetName) {
        const presets = {
            wolf: {
                name: "野狼",
                icon: "🐺",
                level: 1,
                threatLevel: 0,
                maxHealth: 25,
                maxMana: 100,
                attackPower: 10,
                defense: 1,
                moveSpeed: 5,
                manaRegen: 0.1,
                weight: 20,
                volume: 100,
                skills: [],
                equipment: {}
            },
            boar: {
                name: "野猪",
                icon: "🐗",
                level: 1,
                threatLevel: 0,
                maxHealth: 40,
                maxMana: 100,
                attackPower: 6,
                defense: 2,
                moveSpeed: 6,
                manaRegen: 0.1,
                weight: 30,
                volume: 100,
                skills: [],
                equipment: {}
            },
            snake: {
                name: "蟒蛇",
                icon: "🐍",
                level: 1,
                threatLevel: 0,
                maxHealth: 25,
                maxMana: 100,
                attackPower: 8,
                defense: 1,
                moveSpeed: 8,
                manaRegen: 0.1,
                weight: 10,
                volume: 100,
                skills: [],
                equipment: {}
            },
            bear: {
                name: "巨熊",
                icon: "🐻",
                level: 1,
                threatLevel: 0,
                maxHealth: 50, // 从100减少50%到50
                maxMana: 100,
                attackPower: 12,
                defense: 5,
                moveSpeed: 1,
                manaRegen: 0.1,
                weight: 80,
                volume: 100,
                skills: [],
                equipment: {}
            },
            monkey: {
                name: "猴子",
                icon: "🐵",
                level: 1,
                threatLevel: 0,
                maxHealth: 23,
                maxMana: 100,
                attackPower: 4,
                defense: 2,
                moveSpeed: 10,
                manaRegen: 0.1,
                weight: 40,
                volume: 100,
                skills: [],
                equipment: {}
            },
            gorilla: {
                name: "猩猩",
                icon: "🦍",
                level: 1,
                threatLevel: 0,
                maxHealth: 60,
                maxMana: 100,
                attackPower: 5,
                defense: 5,
                moveSpeed: 2,
                manaRegen: 0.1,
                weight: 92,
                volume: 100,
                skills: [],
                equipment: {}
            },
            fox: {
                name: "狐狸",
                icon: "🦊",
                level: 1,
                threatLevel: 0,
                maxHealth: 23,
                maxMana: 100,
                attackPower: 4,
                defense: 3,
                moveSpeed: 7,
                manaRegen: 0.1,
                weight: 50,
                volume: 100,
                skills: [],
                equipment: {}
            },
            skeleton: {
                name: "骷髅",
                icon: "💀",
                level: 1,
                threatLevel: 0,
                maxHealth: 43,
                maxMana: 100,
                attackPower: 4,
                defense: 2,
                moveSpeed: 5,
                manaRegen: 0.1,
                weight: 65,
                volume: 100,
                skills: [],
                equipment: {}
            },
            ghost: {
                name: "幽灵",
                icon: "👻",
                level: 1,
                threatLevel: 0,
                maxHealth: 75,
                maxMana: 100,
                attackPower: 3,
                defense: 0,
                moveSpeed: 5,
                manaRegen: 0.1,
                weight: 10,
                volume: 100,
                skills: [],
                equipment: {}
            },
            troll: {
                name: "巨魔",
                icon: "👹",
                level: 1,
                threatLevel: 0,
                maxHealth: 200,
                maxMana: 100,
                attackPower: 10,
                defense: 3,
                moveSpeed: 5,
                manaRegen: 0.1,
                weight: 120,
                volume: 100,
                skills: [],
                equipment: {}
            },
            tiger: {
                name: "老虎",
                icon: "🐯",
                level: 1,
                threatLevel: 0,
                maxHealth: 90,
                maxMana: 100,
                attackPower: 8,
                defense: 4,
                moveSpeed: 4,
                manaRegen: 0.1,
                weight: 70,
                volume: 100,
                skills: [],
                equipment: {}
            }
        };
        
        return presets[presetName] || presets.wolf;
    }
    
    // 获取所有敌人预设名称
    static getAllPresetNames() {
        return ['wolf', 'boar', 'snake', 'bear', 'monkey', 'gorilla', 'fox', 'skeleton', 'ghost', 'troll', 'tiger'];
    }
    
    // 随机生成敌人
    static generateRandomEnemy() {
        const presetNames = this.getAllPresetNames();
        const randomPreset = presetNames[Math.floor(Math.random() * presetNames.length)];
        return new Enemy(this.getPreset(randomPreset));
    }
}

// 资源点类
class ResourcePoint {
    constructor(data) {
        this.name = data.name;
        this.icon = data.icon;
        this.type = 'ResourcePoint'; // 标识为资源点类型
        this.resourceType = data.type; // 'mineral', 'wood', 'herb' - 资源类型
        this.maxHealth = data.maxHealth || 100;
        this.currentHealth = data.currentHealth || this.maxHealth;
        this.defense = data.defense || 0;
        this.drops = data.drops || []; // 掉落物列表
        
        // 位置相关属性
        this.x = 0;
        this.y = 0;
        this.radius = 20; // 资源点半径
        
        // 资源点特性
        this.isResourcePoint = true; // 标识为资源点
        this.canMove = false; // 资源点不会移动
        this.canAttack = false; // 资源点不会攻击
        
        // 无敌系统
        this.isInvincible = false; // 是否处于无敌状态
        this.invincibilityEndTime = 0; // 无敌结束时间
    }
    
    // 检查是否存活
    isAlive() {
        return this.currentHealth > 0;
    }
    
    // 受到伤害
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        return actualDamage;
    }
    
    // 设置无敌状态
    setInvincible(duration) {
        this.isInvincible = true;
        this.invincibilityEndTime = Date.now() + duration;
    }
    
    // 更新无敌状态
    updateInvincibility() {
        if (this.isInvincible && Date.now() >= this.invincibilityEndTime) {
            this.isInvincible = false;
        }
    }
    
    // 检查是否处于无敌状态
    isCurrentlyInvincible() {
        this.updateInvincibility();
        return this.isInvincible;
    }
    
    // 获取掉落物
    getDrops() {
        const drops = [];
        this.drops.forEach(drop => {
            if (Math.random() < drop.chance) {
                for (let i = 0; i < drop.quantity; i++) {
                    drops.push(drop.itemId);
                }
            }
        });
        return drops;
    }
}

// 资源点预设
class ResourcePointPresets {
    static getPreset(presetName) {
        const presets = {
            copper_vein: {
                name: "铜矿脉",
                icon: "⛰️",
                type: "mineral",
                maxHealth: 100,
                defense: 0,
                drops: [
                    { itemId: "copper_ore", chance: 1.0, quantity: 1 }
                ]
            },
            oak_tree: {
                name: "橡树",
                icon: "🌳",
                type: "wood",
                maxHealth: 100,
                defense: 0,
                drops: [
                    { itemId: "oak_wood", chance: 1.0, quantity: 1 }
                ]
            },
            herb_bush: {
                name: "香草丛",
                icon: "🌿",
                type: "herb",
                maxHealth: 100,
                defense: 0,
                drops: [
                    { itemId: "herb_leaf", chance: 1.0, quantity: 1 }
                ]
            }
        };
        
        return presets[presetName] || presets.copper_vein;
    }
    
    // 根据关卡获取可生成的资源点类型
    static getResourceTypesForLevel(levelId) {
        const levelResources = {
            7: ['copper_vein', 'oak_tree', 'herb_bush'], // 草原关卡：铜矿脉、橡树、香草丛
            8: ['oak_tree', 'herb_bush', 'copper_vein'] // 森林关卡：橡树、香草丛、铜矿脉
        };
        
        return levelResources[levelId] || ['copper_vein'];
    }
    
    // 为指定关卡生成随机资源点
    static generateRandomResourcePoint(levelId) {
        const availableTypes = this.getResourceTypesForLevel(levelId);
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const resourceData = this.getPreset(randomType);
        return new ResourcePoint(resourceData);
    }
}

// 角色类
class Character {
    constructor(data) {
        this.name = data.name;
        this.title = data.title || ''; // 称号
        this.avatar = data.avatar;
        this.type = data.type || 'Player'; // 角色类型：Player 或 NPC
        this.level = data.level || 1; // 等级
        this.maxLevel = data.maxLevel || 50; // 等级上限
        this.profession = data.profession || '新手'; // 职业
        this.attributes = {
            strength: data.attributes?.strength || 1,
            agility: data.attributes?.agility || 1,
            intelligence: data.attributes?.intelligence || 1,
            skill: data.attributes?.skill || 1
        };
        
        // 基础副属性（不受主属性影响的部分）
        this.baseSecondaryAttributes = {
            attackPower: data.secondaryAttributes?.attackPower || 10,
            defense: data.secondaryAttributes?.defense || 5,
            moveSpeed: data.secondaryAttributes?.moveSpeed || 10,
            healthRegen: data.secondaryAttributes?.healthRegen || 0.1,
            manaRegen: data.secondaryAttributes?.manaRegen || 2,
            weight: data.secondaryAttributes?.weight || 50,
            volume: data.secondaryAttributes?.volume || 100,
            expGain: data.secondaryAttributes?.expGain || 100
        };
        
        // 计算最终副属性（基础值 + 主属性加成）
        this.secondaryAttributes = this.calculateSecondaryAttributes();
        
        // 计算最大生命值（基础100 + 主属性加成）
        this.maxHealth = this.calculateMaxHealth(data.maxHealth);
        this.currentHealth = data.currentHealth || this.maxHealth;
        this.maxMana = data.maxMana || 100;
        this.currentMana = data.currentMana || 0;
        this.maxExp = this.calculateMaxExperience(); // 使用递增公式计算最大经验值
        this.currentExp = data.currentExp || 0; // 当前经验值
        this.skills = data.skills || [null, null, null, null]; // 4个技能槽位
        this.skillSlotLocks = data.skillSlotLocks || [true, true, true, true]; // 技能槽锁定状态，默认全部锁定
        this.skillSlot1PassiveOnly = true; // 技能槽1只能装备被动技能
        this.skillSlot1Locked = true; // 技能槽1默认锁定，无法手动操作
        this.skillSlot2ActiveOnly = true; // 技能槽位1（索引1）只能装备主动技能
        this.learnedSkills = data.learnedSkills || []; // 已学会的技能列表
        this.equipment = {
            weapon: data.equipment?.weapon || null,
            armor: data.equipment?.armor || null,
            offhand: data.equipment?.offhand || null,
            misc: data.equipment?.misc || null
        };
        
        // 状态效果系统
        this.statusEffects = []; // 当前状态效果列表
        
        // 战斗相关属性
        this.x = data.x || 0; // X坐标
        this.y = data.y || 0; // Y坐标
        this.radius = 25; // 圆形半径
        this.directionX = 0; // X方向移动向量
        this.directionY = 0; // Y方向移动向量
        this.finalMoveSpeed = 0; // 最终移动速度
        this.isKnockingBack = false; // 是否在弹开状态
        
        // 无敌系统
        this.isInvincible = false; // 是否处于无敌状态
        this.invincibilityEndTime = 0; // 无敌结束时间
        
        // 死亡和复活系统
        this.isDead = data.isDead || false;
        this.deathTime = data.deathTime || 0;
        this.reviveCountdown = data.reviveCountdown || 0;
    }
    
    // 计算最大生命值
    calculateMaxHealth(baseMaxHealth = 100) {
        // 基础生命值 + 每点主属性增加1点生命值
        const attributeBonus = this.attributes.strength + this.attributes.agility + 
                              this.attributes.intelligence + this.attributes.skill;
        
        // 获取装备生命值加成
        let equipmentHealthBonus = 0;
        if (this.equipment && typeof this.getEquipmentBonuses === 'function') {
            try {
                const equipmentBonuses = this.getEquipmentBonuses();
                equipmentHealthBonus = equipmentBonuses.maxHealth || 0;
            } catch (error) {
                console.warn('计算装备生命值加成时出错:', error);
            }
        }
        
        // 计算基础最大生命值
        let maxHealth = baseMaxHealth + attributeBonus + equipmentHealthBonus;
        
        // 应用被动技能倍率
        if (this.skills && typeof this.getPassiveSkillBonuses === 'function') {
            try {
                const passiveBonuses = this.getPassiveSkillBonuses();
                if (passiveBonuses.multipliers && passiveBonuses.multipliers.maxHealthMultiplier) {
                    maxHealth *= passiveBonuses.multipliers.maxHealthMultiplier;
                }
            } catch (error) {
                console.warn('计算被动技能生命值倍率时出错:', error);
            }
        }
        
        return Math.floor(maxHealth);
    }
    
    // 计算最终副属性
    calculateSecondaryAttributes() {
        const base = this.baseSecondaryAttributes;
        
        // 安全地获取被动技能加成
        let passiveBonuses = {
            attackPower: 0, defense: 0, moveSpeed: 0, healthRegen: 0, manaRegen: 0
        };
        
        // 只有在技能系统完全初始化后才计算被动技能加成
        if (this.skills && typeof this.getPassiveSkillBonuses === 'function') {
            try {
                passiveBonuses = this.getPassiveSkillBonuses();
            } catch (error) {
                console.warn('计算被动技能加成时出错:', error);
            }
        }
        
        // 获取状态效果加成
        let statusBonuses = {
            attackPower: 0, defense: 0, moveSpeed: 0, healthRegen: 0, manaRegen: 0
        };
        
        if (this.statusEffects) {
            let totalAttackMultiplier = 0;
            this.statusEffects.forEach(effect => {
                // 检查effect是否有applyToCharacter方法
                if (effect.applyToCharacter && typeof effect.applyToCharacter === 'function') {
                    const effects = effect.applyToCharacter(this);
                    if (effects.defenseBonus) statusBonuses.defense += effects.defenseBonus;
                    if (effects.moveSpeedBonus) statusBonuses.moveSpeed += effects.moveSpeedBonus; // 添加移动速度加成处理
                    if (effects.attackPowerMultiplier) {
                        // 累积攻击力倍数，但限制最大值
                        totalAttackMultiplier += (effects.attackPowerMultiplier - 1);
                    }
                } else if (effect.effects) {
                    // 处理简单的状态效果对象
                    if (effect.effects.defenseBonus) statusBonuses.defense += effect.effects.defenseBonus;
                    if (effect.effects.moveSpeedBonus) statusBonuses.moveSpeed += effect.effects.moveSpeedBonus;
                    if (effect.effects.attackPowerMultiplier) {
                        totalAttackMultiplier += (effect.effects.attackPowerMultiplier - 1);
                    }
                }
            });
            
            // 限制总攻击力倍数增长不超过100%
            totalAttackMultiplier = Math.min(totalAttackMultiplier, 1.0);
            statusBonuses.attackPower += (base.attackPower + this.attributes.strength) * totalAttackMultiplier;
        }
        
        // 获取装备加成
        let equipmentBonuses = {
            attackPower: 0, defense: 0, moveSpeed: 0, healthRegen: 0, manaRegen: 0,
            maxHealth: 0, expGain: 0, strength: 0, agility: 0, intelligence: 0, skill: 0
        };
        
        if (this.equipment && typeof this.getEquipmentBonuses === 'function') {
            try {
                equipmentBonuses = this.getEquipmentBonuses();
            } catch (error) {
                console.warn('计算装备加成时出错:', error);
            }
        }
        
        return {
            // 攻击力 = (基础攻击力 + 力量 + 装备力量加成 + 被动技能加成 + 状态效果加成 + 装备攻击力加成) * 被动技能倍率
            attackPower: Math.floor((base.attackPower + this.attributes.strength + (equipmentBonuses.strength || 0) + passiveBonuses.attackPower + statusBonuses.attackPower + (equipmentBonuses.attackPower || 0)) * (passiveBonuses.multipliers ? passiveBonuses.multipliers.attackPowerMultiplier : 1)),
            
            // 防御力 = 基础防御力 + 被动技能加成 + 状态效果加成 + 装备防御力加成
            defense: base.defense + passiveBonuses.defense + statusBonuses.defense + (equipmentBonuses.defense || 0),
            
            // 移动速度 = (基础移动速度 + 敏捷 + 装备敏捷加成 + 被动技能加成 + 状态效果加成 + 装备移动速度加成) * 被动技能倍率
            moveSpeed: Math.floor((base.moveSpeed + this.attributes.agility + (equipmentBonuses.agility || 0) + passiveBonuses.moveSpeed + statusBonuses.moveSpeed + (equipmentBonuses.moveSpeed || 0)) * (passiveBonuses.multipliers ? passiveBonuses.multipliers.moveSpeedMultiplier : 1)),
            
            // 生命恢复速度 = (基础生命恢复 + 技巧 * 0.1 + 装备技巧加成 * 0.1 + 被动技能加成 + 状态效果加成 + 装备生命恢复加成) * 被动技能倍率
            healthRegen: (base.healthRegen + (this.attributes.skill * 0.1) + ((equipmentBonuses.skill || 0) * 0.1) + passiveBonuses.healthRegen + statusBonuses.healthRegen + (equipmentBonuses.healthRegen || 0)) * (passiveBonuses.multipliers ? passiveBonuses.multipliers.healthRegenMultiplier : 1),
            
            // 魔法恢复速度 = (基础魔法恢复 + 智慧 * 0.5 + 装备智慧加成 * 0.5 + 被动技能加成 + 状态效果加成 + 装备魔法恢复加成) * 被动技能倍率
            manaRegen: (base.manaRegen + (this.attributes.intelligence * 0.5) + ((equipmentBonuses.intelligence || 0) * 0.5) + passiveBonuses.manaRegen + statusBonuses.manaRegen + (equipmentBonuses.manaRegen || 0)) * (passiveBonuses.multipliers ? passiveBonuses.multipliers.manaRegenMultiplier : 1),
            
            // 体重 = 基础体重 + 力量 * 2 + 装备力量加成 * 2
            weight: base.weight + (this.attributes.strength * 2) + ((equipmentBonuses.strength || 0) * 2),
            
            // 体积 = 基础体积（不受主属性影响）
            volume: base.volume,
            
            // 经验值获取量 = (基础经验获取 + 智慧 + 装备智慧加成 + 装备经验获取加成) * 被动技能倍率
            expGain: Math.floor((base.expGain + this.attributes.intelligence + (equipmentBonuses.intelligence || 0) + (equipmentBonuses.expGain || 0)) * (passiveBonuses.multipliers ? passiveBonuses.multipliers.expGainMultiplier : 1))
        };
    }
    
    // 更新属性时重新计算副属性和生命值
    updateAttributes() {
        this.secondaryAttributes = this.calculateSecondaryAttributes();
        const oldMaxHealth = this.maxHealth;
        this.maxHealth = this.calculateMaxHealth(100);
        
        // 如果最大生命值增加，按比例增加当前生命值
        if (this.maxHealth > oldMaxHealth) {
            const healthRatio = this.currentHealth / oldMaxHealth;
            this.currentHealth = Math.floor(this.maxHealth * healthRatio);
        }
        
        // 更新最大经验值
        this.maxExp = this.calculateMaxExperience();
    }
    
    // 计算角色升级所需的最大经验值（递增公式）
    calculateMaxExperience() {
        // RPG经典递增公式：基础经验 * (等级^指数) + 等级线性增长
        // 公式：100 * (level^1.5) + level * 50
        // 这样设计的好处：
        // - 1级: 150经验 (相对容易)
        // - 5级: 1370经验 (中等难度)
        // - 10级: 4662经验 (较难)
        // - 20级: 18944经验 (很难)
        // - 50级: 267678经验 (极难)
        
        const baseExp = 100; // 基础经验值
        const exponentialFactor = Math.pow(this.level, 1.5); // 指数增长因子
        const linearFactor = this.level * 50; // 线性增长因子
        
        const maxExp = Math.floor(baseExp * exponentialFactor + linearFactor);
        
        // 确保最小经验值为100
        return Math.max(100, maxExp);
    }
    
    // 学习技能
    learnSkill(skillId) {
        console.log(`角色 ${this.getDisplayName()} 尝试学习技能: ${skillId}`);
        
        const skillData = SkillPresets.getPreset(skillId);
        if (!skillData) {
            console.log('技能不存在:', skillId);
            return false;
        }
        
        // 检查是否已经学会
        if (this.learnedSkills.find(skill => skill.id === skillId)) {
            console.log('已经学会该技能:', skillData.name);
            return false;
        }
        
        const skill = new Skill(skillData);
        this.learnedSkills.push(skill);
        
        console.log(`${this.getDisplayName()} 学会了技能: ${skill.name}`);
        console.log(`当前已学技能数量: ${this.learnedSkills.length}`);
        console.log(`已学技能列表: ${this.learnedSkills.map(s => s.name).join(', ')}`);
        
        return true;
    }
    
    // 检查是否已学会某个技能
    hasLearnedSkill(skillId) {
        return this.learnedSkills.some(skill => skill.id === skillId);
    }
    
    // 获取已学会的技能
    getLearnedSkill(skillId) {
        return this.learnedSkills.find(skill => skill.id === skillId);
    }
    
    // 使用技能书
    useSkillBook(skillBookItem) {
        if (!skillBookItem.skillId) {
            console.log('技能书没有关联的技能ID');
            return false;
        }
        
        // 检查是否已经学会该技能
        if (this.hasLearnedSkill(skillBookItem.skillId)) {
            console.log(`${this.getDisplayName()} 已经学会了技能: ${skillBookItem.name}`);
            return false;
        }
        
        // 学习技能
        const success = this.learnSkill(skillBookItem.skillId);
        if (success) {
            console.log(`${this.getDisplayName()} 使用技能书学会了新技能`);
        }
        
        return success;
    }
    
    // 装备技能到技能槽
    equipSkill(skillId, slotIndex) {
        if (slotIndex < 0 || slotIndex >= 4) {
            console.log('技能槽位无效:', slotIndex);
            return false;
        }
        
        // 检查技能槽是否被锁定
        if (this.skillSlotLocks[slotIndex]) {
            console.log(`技能槽位 ${slotIndex + 1} 被锁定，无法装备技能`);
            return false;
        }
        
        // 检查技能槽1的特殊限制
        if (slotIndex === 0) {
            if (this.skillSlot1Locked) {
                console.log('技能槽1被锁定，无法手动装备技能');
                return false;
            }
            
            // 技能槽1只能装备被动技能
            const skillData = SkillPresets.getPreset(skillId);
            if (!skillData || skillData.type !== 'passive') {
                console.log('技能槽1只能装备被动技能');
                return false;
            }
        }
        
        // 检查技能槽位1（索引1）的主动技能限制
        if (slotIndex === 1) {
            // 技能槽位1只能装备主动技能
            const skillData = SkillPresets.getPreset(skillId);
            if (!skillData || skillData.type !== 'active') {
                console.log('技能槽位1只能装备主动技能');
                return false;
            }
        }
        
        const skill = this.learnedSkills.find(s => s.id === skillId);
        if (!skill) {
            console.log('未学会该技能:', skillId);
            return false;
        }
        
        this.skills[slotIndex] = skill;
        console.log(`${this.getDisplayName()} 装备技能 ${skill.name} 到槽位 ${slotIndex + 1}`);
        
        // 装备技能后重新计算属性（重要！）
        this.updateAttributes();
        
        return true;
    }
    
    // 卸下技能
    unequipSkill(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 4) {
            console.log('技能槽位无效:', slotIndex);
            return false;
        }
        
        // 检查技能槽是否被锁定
        if (this.skillSlotLocks[slotIndex]) {
            console.log(`技能槽位 ${slotIndex + 1} 被锁定，无法卸下技能`);
            return false;
        }
        
        // 检查技能槽1的特殊限制
        if (slotIndex === 0 && this.skillSlot1Locked) {
            console.log('技能槽1被锁定，无法手动卸下技能');
            return false;
        }
        
        const skill = this.skills[slotIndex];
        if (!skill) {
            console.log('该槽位没有技能');
            return false;
        }
        
        this.skills[slotIndex] = null;
        console.log(`${this.getDisplayName()} 卸下了技能 ${skill.name}`);
        
        // 卸下技能后重新计算属性（重要！）
        this.updateAttributes();
        
        return true;
    }
    
    // 解锁技能槽
    unlockSkillSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 4) {
            console.log('技能槽位无效:', slotIndex);
            return false;
        }
        
        if (!this.skillSlotLocks[slotIndex]) {
            console.log(`技能槽位 ${slotIndex + 1} 已经解锁`);
            return false;
        }
        
        this.skillSlotLocks[slotIndex] = false;
        console.log(`${this.getDisplayName()} 解锁了技能槽位 ${slotIndex + 1}`);
        return true;
    }
    
    // 锁定技能槽
    lockSkillSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 4) {
            console.log('技能槽位无效:', slotIndex);
            return false;
        }
        
        if (this.skillSlotLocks[slotIndex]) {
            console.log(`技能槽位 ${slotIndex + 1} 已经锁定`);
            return false;
        }
        
        // 如果槽位有技能，先卸下
        if (this.skills[slotIndex]) {
            this.skills[slotIndex] = null;
            // 卸下技能后重新计算属性
            this.updateAttributes();
        }
        
        this.skillSlotLocks[slotIndex] = true;
        console.log(`${this.getDisplayName()} 锁定了技能槽位 ${slotIndex + 1}`);
        return true;
    }
    
    // 检查技能槽是否解锁
    isSkillSlotUnlocked(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 4) {
            return false;
        }
        return !this.skillSlotLocks[slotIndex];
    }
    
    // 获取解锁的技能槽数量
    getUnlockedSkillSlotCount() {
        return this.skillSlotLocks.filter(locked => !locked).length;
    }
    
    // 使用技能
    useSkill(slotIndex, target = null) {
        if (slotIndex < 0 || slotIndex >= 4) {
            return false;
        }
        
        const skill = this.skills[slotIndex];
        if (!skill) {
            return false;
        }
        
        return skill.use(this, target);
    }
    
    // 检查是否可以自动释放主动技能
    canAutoUseActiveSkills() {
        return this.currentMana >= 100;
    }
    
    // 自动使用主动技能
    autoUseActiveSkills(enemies = []) {
        if (!this.canAutoUseActiveSkills()) {
            return false;
        }
        
        // 查找装备的主动技能
        const activeSkills = this.skills.filter(skill => skill && skill.type === 'active');
        if (activeSkills.length === 0) {
            return false;
        }
        
        // 随机选择一个主动技能使用
        const randomSkill = activeSkills[Math.floor(Math.random() * activeSkills.length)];
        
        // 使用技能（传入游戏实例）
        const success = randomSkill.use(this, window.game);
        if (success) {
            // 重置魔法值为0
            this.currentMana = 0;
            console.log(`${this.getDisplayName()} 自动释放了主动技能: ${randomSkill.name}`);
        }
        
        return success;
    }
    
    // 获取被动技能加成
    getPassiveSkillBonuses() {
        const bonuses = {
            attackPower: 0,
            defense: 0,
            moveSpeed: 0,
            healthRegen: 0,
            manaRegen: 0
        };
        
        const multipliers = {
            maxHealthMultiplier: 1,
            attackPowerMultiplier: 1,
            moveSpeedMultiplier: 1,
            healthRegenMultiplier: 1,
            manaRegenMultiplier: 1,
            expGainMultiplier: 1,      // 新增：经验获取倍率
            sizeMultiplier: 1,         // 新增：体积倍率
            weightMultiplier: 1        // 新增：体重倍率
        };
        
        this.skills.forEach(skill => {
            if (skill && skill.type === 'passive' && skill.effects) {
                const effects = skill.effects;
                
                // 处理旧式的attributeBonus
                if (effects.attributeBonus) {
                    const bonus = effects.attributeBonus;
                    Object.keys(bonus).forEach(attr => {
                        if (bonuses.hasOwnProperty(attr)) {
                            bonuses[attr] += bonus[attr] * skill.level;
                        }
                    });
                }
                
                // 处理新式的倍率效果
                if (effects.maxHealthMultiplier) {
                    multipliers.maxHealthMultiplier *= effects.maxHealthMultiplier;
                }
                if (effects.attackPowerMultiplier) {
                    multipliers.attackPowerMultiplier *= effects.attackPowerMultiplier;
                }
                if (effects.moveSpeedMultiplier) {
                    multipliers.moveSpeedMultiplier *= effects.moveSpeedMultiplier;
                }
                if (effects.healthRegenMultiplier) {
                    multipliers.healthRegenMultiplier *= effects.healthRegenMultiplier;
                }
                if (effects.manaRegenMultiplier) {
                    multipliers.manaRegenMultiplier *= effects.manaRegenMultiplier;
                }
                
                // 新增技能效果处理
                if (effects.expGainMultiplier) {
                    multipliers.expGainMultiplier *= effects.expGainMultiplier;
                }
                if (effects.sizeMultiplier) {
                    multipliers.sizeMultiplier *= effects.sizeMultiplier;
                }
                if (effects.weightMultiplier) {
                    multipliers.weightMultiplier *= effects.weightMultiplier;
                }
                
                // 处理条件性加成（如裸奔爱好者）
                if (effects.conditionalBonus) {
                    const conditional = effects.conditionalBonus;
                    let conditionMet = false;
                    
                    if (conditional.condition === 'no_armor') {
                        // 检查是否没有装备护甲
                        // equipment是对象 {weapon, armor, offhand, misc}
                        conditionMet = !this.equipment || !this.equipment.armor;
                        
                        console.log(`裸奔爱好者条件检查: 护甲装备=${this.equipment?.armor?.name || '无'}, 条件满足=${conditionMet}`);
                    }
                    
                    if (conditionMet) {
                        console.log(`裸奔爱好者触发! 攻击力倍率: ${conditional.attackPowerMultiplier}, 移动速度倍率: ${conditional.moveSpeedMultiplier}`);
                        
                        if (conditional.attackPowerMultiplier) {
                            multipliers.attackPowerMultiplier *= conditional.attackPowerMultiplier;
                        }
                        if (conditional.moveSpeedMultiplier) {
                            multipliers.moveSpeedMultiplier *= conditional.moveSpeedMultiplier;
                        }
                    }
                }
            }
        });
        
        // 将倍率信息也返回，供其他方法使用
        bonuses.multipliers = multipliers;
        return bonuses;
    }
    
    // 添加状态效果
    addStatusEffect(statusEffect) {
        // 为简单状态效果添加startTime
        if (!statusEffect.startTime && statusEffect.duration) {
            statusEffect.startTime = Date.now();
        }
        
        // 检查是否已存在相同ID的状态效果
        const existingIndex = this.statusEffects.findIndex(effect => effect.id === statusEffect.id);
        
        if (existingIndex > -1) {
            // 如果已存在，替换为新的状态效果（刷新持续时间）
            this.statusEffects[existingIndex] = statusEffect;
        } else {
            // 如果不存在，添加新的状态效果
            this.statusEffects.push(statusEffect);
        }
        
        // 重新计算属性
        this.updateAttributes();
        
        console.log(`${this.getDisplayName()} 获得状态效果: ${statusEffect.name || statusEffect.type}`);
    }
    
    // 移除状态效果
    removeStatusEffect(statusEffectId) {
        const index = this.statusEffects.findIndex(effect => effect.id === statusEffectId);
        if (index > -1) {
            const removedEffect = this.statusEffects.splice(index, 1)[0];
            
            // 重新计算属性
            this.updateAttributes();
            
            console.log(`${this.getDisplayName()} 失去状态效果: ${removedEffect.name}`);
            return true;
        }
        return false;
    }
    
    // 更新状态效果（移除过期的状态效果）
    updateStatusEffects() {
        const currentTime = Date.now();
        let removedAny = false;
        
        // 从后往前遍历，避免删除元素时索引问题
        for (let i = this.statusEffects.length - 1; i >= 0; i--) {
            const effect = this.statusEffects[i];
            
            // 检查状态效果是否过期
            let isExpired = false;
            if (effect.isExpired && typeof effect.isExpired === 'function') {
                // 使用状态效果对象的isExpired方法
                isExpired = effect.isExpired();
            } else if (effect.startTime && effect.duration) {
                // 对于简单状态效果，使用时间计算
                isExpired = (currentTime - effect.startTime) >= effect.duration;
            } else if (effect.duration && !effect.startTime) {
                // 如果没有startTime，添加一个并设置为当前时间
                effect.startTime = currentTime;
                isExpired = false;
            }
            
            if (isExpired) {
                console.log(`${this.getDisplayName()} 的状态效果 ${effect.name || effect.type} 已过期`);
                this.statusEffects.splice(i, 1);
                removedAny = true;
            }
        }
        
        // 如果移除了任何状态效果，重新计算属性
        if (removedAny) {
            this.updateAttributes();
        }
    }
    
    // 检查是否有特定状态效果
    hasStatusEffect(statusEffectId) {
        return this.statusEffects.some(effect => effect.id === statusEffectId);
    }
    
    // 获取特定状态效果
    getStatusEffect(statusEffectId) {
        return this.statusEffects.find(effect => effect.id === statusEffectId);
    }
    
    // 设置无敌状态
    setInvincible(duration) {
        this.isInvincible = true;
        this.invincibilityEndTime = Date.now() + duration;
    }
    
    // 更新无敌状态
    updateInvincibility() {
        if (this.isInvincible && Date.now() >= this.invincibilityEndTime) {
            this.isInvincible = false;
        }
    }
    
    // 检查是否处于无敌状态
    isCurrentlyInvincible() {
        this.updateInvincibility();
        return this.isInvincible;
    }
    
    // 获取完整显示名称（称号 + 名字）
    getDisplayName() {
        return this.title ? `${this.title}${this.name}` : this.name;
    }
    
    // 装备物品
    equipItem(item, slot) {
        if (item.type !== "装备") {
            console.log("只能装备装备类型的物品");
            return false;
        }
        
        // 验证装备类型和槽位匹配
        const slotTypeMap = {
            "武器": "weapon",
            "护甲": "armor", 
            "副手": "offhand",
            "杂项": "misc"
        };
        
        const expectedSlot = slotTypeMap[item.equipmentType];
        if (slot !== expectedSlot) {
            console.log(`装备类型不匹配：${item.equipmentType} 不能装备到 ${slot} 槽位`);
            return false;
        }
        
        // 卸下当前装备
        if (this.equipment[slot]) {
            this.unequipItem(slot);
        }
        
        // 装备新物品
        this.equipment[slot] = item;
        this.updateAttributes(); // 重新计算属性
        
        console.log(`${this.getDisplayName()} 装备了 ${item.name}`);
        return true;
    }
    
    // 卸下装备
    unequipItem(slot) {
        if (!this.equipment[slot]) {
            console.log(`${slot} 槽位没有装备`);
            return false;
        }
        
        const item = this.equipment[slot];
        this.equipment[slot] = null;
        this.updateAttributes(); // 重新计算属性
        
        console.log(`${this.getDisplayName()} 卸下了 ${item.name}`);
        return item;
    }
    
    // 获取所有装备的属性加成
    getEquipmentBonuses() {
        const totalBonuses = {};
        
        Object.values(this.equipment).forEach(item => {
            if (item && item.type === "装备") {
                const bonuses = item.getEquipmentBonuses();
                
                Object.entries(bonuses).forEach(([attribute, value]) => {
                    if (totalBonuses[attribute]) {
                        totalBonuses[attribute] += value;
                    } else {
                        totalBonuses[attribute] = value;
                    }
                });
            }
        });
        
        return totalBonuses;
    }
    
    // 将角色数据转换为JSON格式（用于存档）
    toJSON() {
        return {
            name: this.name,
            title: this.title,
            avatar: this.avatar,
            type: this.type,
            level: this.level,
            maxLevel: this.maxLevel,
            profession: this.profession,
            attributes: { ...this.attributes },
            secondaryAttributes: { ...this.baseSecondaryAttributes },
            maxHealth: this.maxHealth,
            currentHealth: this.currentHealth,
            maxMana: this.maxMana,
            currentMana: this.currentMana,
            maxExp: this.maxExp,
            currentExp: this.currentExp,
            skills: this.skills,
            skillSlotLocks: [...this.skillSlotLocks],
            learnedSkills: this.learnedSkills,
            equipment: {
                weapon: this.equipment.weapon,
                armor: this.equipment.armor,
                offhand: this.equipment.offhand,
                misc: this.equipment.misc
            },
            isDead: this.isDead,
            deathTime: this.deathTime,
            reviveCountdown: this.reviveCountdown,
            x: this.x,
            y: this.y
        };
    }
}

// 角色预设
class CharacterPresets {
    // 角色名预制体
    static namePresets = [
        '凯', '李', '林', '摩根', '巴克', '费恩', '塞斯', '奥莱', '迪克', '陈',
        '艾尔', '赫尔', '坎', '艾力', '瑞克', '莱恩', '卡尔', '麦克', '赵', '莱伊',
        '山本', '龟田', '青木', '藤原', '松下', '刘', '王', '乔', '董', '莉莉',
        '查理斯', '戈登', '安迪', '哈利', '朴', '金', '曼', '苏', '秦',
        // 新增角色名
        '哈登', '麦林', '萌萌', '杰米', '孙', '吴', '张', '朱', '明', '乐乐',
        '西西', '柳', '严', '贝贝', '黄', '兰', '洪', '梓', '郭', '高',
        '牛牛', '周', '佐佐', '木', '泉', '赛科', '肯特', '罗斯', '祁', '杨',
        '劳拉', '杰洛特', '杰夫', '沃尔夫', '法林',
        // 最新新增角色名
        '詹姆斯', '威廉', '杜比特', '斑', '楠', '邓', '小鸟游', '爱音', '琴音', '石原',
        '麻里', '小泽', '东尼', '穆', '由衣', '工藤', '樱', '旗木', '波波', '悠',
        '穹', '汤姆', '山姆', '马尔斯', '瑛', '不知火', '莹', '凉子', '佳代子', '奈绪',
        '弥助', '佐藤', '隆', '坂田', '本田', '渚', '佐仓', '桥本', '藤本', '埼玉'
    ];
    
    // 称号预制体
    static titlePresets = [
        '勇敢的', '愚蠢的', '机智的', '好色的', '疯狂的',
        '爱笑的', '懦弱的', '贪吃的', '冷酷的', '可爱的',
        '软绵绵的', '香香的', '狡猾的', '阴暗的', '自闭的',
        '色咪咪的', '病怏怏的', '闪耀的', '四肢发达的', '强势的',
        '火辣的', '冷漠的', '魅力四射的', '毛手毛脚的', '懒惰的',
        '勤奋的', '低情商的', '高情商的', '受欢迎的',
        // 新增称号
        '自作聪明的', '骚话连篇的', '嘴臭的', '脚臭的', '一瘸一拐的',
        '迷之自信的', '乐于助人的', '慷慨的', '自私的', '油腻的',
        '毛茸茸的', '活蹦乱跳的', '结巴的', '社恐的', '目光呆滞的',
        '讲义气的', '彬彬有礼的', '五大三粗的', '娇小的', '瘦弱的',
        '意气风发的', '抠门的', '挑食的', '魁梧的', '肥胖的',
        '高度近视的', '慈祥的', '害羞的', '紧张兮兮的', '从容的',
        '大小眼的', '龅牙的', '双眼皮的', '腿长的', '翘臀的',
        '双下巴的', '大嗓门的', '谨慎的', '运动型的', '室内系的',
        '居家型的', '理科的', '文科的'
    ];
    
    // 人物类型emoji符号
    static avatarPresets = [
        '👨', '👩', '🧑', '👦', '👧', '🧔', '👱‍♂️', '👱‍♀️', 
        '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦲', '👩‍🦲',
        // 新增多样化头像
        '👦🏻', '👦🏼', '👦🏽', '👦🏾', '👦🏿', '👧🏻', '👧🏼', '👧🏽', '👧🏾', '👧🏿',
        '👨‍🦳', '👨🏻', '👨🏻‍🦰', '👨🏻‍🦱', '👨🏻‍🦲', '👨🏻‍🦳', '👨🏼', '👨🏼‍🦰', 
        '👨🏼‍🦱', '👨🏼‍🦲', '👨🏼‍🦳', '👨🏽', '👨🏽‍🦰', '👨🏽‍🦱', '👨🏽‍🦲', '👨🏽‍🦳',
        '👨🏾', '👨🏾‍🦰', '👨🏾‍🦱', '👨🏾‍🦲', '👨🏾‍🦳', '👨🏿', '👨🏿‍🦰', '👨🏿‍🦱', 
        '👨🏿‍🦲', '👨🏿‍🦳', '👩‍🦳', '👩🏻', '👩🏻‍🦰', '👩🏻‍🦲', '👩🏻‍🦳', '👩🏼', 
        '👩🏼‍🦱', '👩🏼‍🦲', '👩🏽', '👩🏽‍🦰', '👩🏽‍🦱', '👩🏽‍🦲', '👩🏽‍🦳', '👩🏾', 
        '👩🏾‍🦰', '👩🏾‍🦱', '👩🏾‍🦲', '👩🏾‍🦳', '👩🏿', '👩🏿‍🦰', '👩🏿‍🦱', '👩🏿‍🦲', 
        '👩🏿‍🦳', '👱🏿', '👱🏽', '👱🏼', '👱🏾', '👴🏻', '👴🏿', '👴🏾', '👴🏽', '👴🏼', 
        '👵🏻', '👵🏽', '👵🏿', '👵🏾', '👵🏼', '🧓🏿', '🧓🏽', '🧓🏻', '🧓', '🧔', '🧒🏻', 
        '🧒🏿', '🧒🏼', '🧒', '🧒🏽', '🧔🏻', '🧔🏾', '🧔🏿', '🧔🏼', '👳', '👳🏽', '👳🏼', 
        '👳🏻', '👸', '👸🏻', '👸🏿', '👸🏽', '👸🏼'
    ];
    
    // 随机选择函数
    static getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    // 生成随机角色数据
    static generateRandomCharacter(attributeType = 'balanced') {
        const name = this.getRandomItem(this.namePresets);
        const title = this.getRandomItem(this.titlePresets);
        const avatar = this.getRandomItem(this.avatarPresets);
        
        // 根据属性类型设置不同的属性分配
        let attributes;
        switch(attributeType) {
            case 'strength':
                attributes = { strength: 1, agility: 1, intelligence: 1, skill: 1 };
                break;
            case 'agility':
                attributes = { strength: 1, agility: 1, intelligence: 1, skill: 1 };
                break;
            case 'intelligence':
                attributes = { strength: 1, agility: 1, intelligence: 1, skill: 1 };
                break;
            case 'skill':
                attributes = { strength: 1, agility: 1, intelligence: 1, skill: 1 };
                break;
            default:
                attributes = { strength: 1, agility: 1, intelligence: 1, skill: 1 };
        }
        
        // 生成随机副属性
        const secondaryAttributes = {
            attackPower: 10,
            defense: 5,
            moveSpeed: 10,
            healthRegen: 0.1,
            manaRegen: 1,
            weight: 50,
            volume: 100,
            expGain: 100
        };
        
        return {
            name: name,
            title: title,
            avatar: avatar,
            type: 'Player',
            level: 1,
            maxLevel: 50,
            profession: '新手',
            attributes: attributes,
            secondaryAttributes: secondaryAttributes,
            maxHealth: 100,
            currentHealth: 100,
            maxMana: 100,
            currentMana: 0,
            maxExp: 100,
            currentExp: 0,
            skills: [null, null, null, null],
            skillSlotLocks: [false, true, true, true], // 默认只有第一个技能槽解锁
            learnedSkills: []
        };
    }
    
    static getPreset(presetName) {
        const presets = {
            // 玩家角色
            warrior: {
                name: "常规角色",
                avatar: "⚔️",
                type: "Player",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            // NPC角色
            merchant: {
                name: "商人",
                avatar: "👲",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            village_chief: {
                name: "村长",
                avatar: "👴",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            incubator: {
                name: "孵化师",
                avatar: "👵",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            warehouse_manager: {
                name: "仓库管理员",
                avatar: "👩",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            character_manager: {
                name: "角色管理员",
                avatar: "👧",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            craftsman: {
                name: "手艺人",
                avatar: "👨🏾",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            recorder: {
                name: "记录员",
                avatar: "👨‍🦳",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            chef: {
                name: "厨子",
                avatar: "👨‍🍳",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            farmer: {
                name: "农夫",
                avatar: "👩‍🌾",
                type: "NPC",
                level: 1,
                maxLevel: 50,
                profession: "新手",
                attributes: { strength: 1, agility: 1, intelligence: 1, skill: 1 },
                secondaryAttributes: {
                    attackPower: 10,
                    defense: 5,
                    moveSpeed: 10,
                    healthRegen: 0.1,
                    manaRegen: 1,
                    weight: 50,
                    volume: 100,
                    expGain: 100
                },
                maxHealth: 100,
                maxMana: 100,
                skills: [null, null, null, null],
                skillSlotLocks: [false, true, true, true],
                learnedSkills: []
            },
            // 随机角色预制体
            random_strength: this.generateRandomCharacter('strength'),
            random_agility: this.generateRandomCharacter('agility'),
            random_intelligence: this.generateRandomCharacter('intelligence'),
            random_skill: this.generateRandomCharacter('skill')
        };
        
        // 如果是随机角色，每次都重新生成
        if (presetName.startsWith('random_')) {
            const type = presetName.replace('random_', '');
            return this.generateRandomCharacter(type);
        }
        
        return presets[presetName] || presets.warrior;
    }
}

// 状态效果类
class StatusEffect {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.icon = data.icon;
        this.duration = data.duration; // 持续时间（毫秒）
        this.effects = data.effects || {}; // 状态效果
        this.startTime = Date.now();
        this.source = data.source; // 施法者
        
        // 持续伤害相关属性（如燃烧效果）
        this.damagePerTick = data.damagePerTick || 0; // 每次伤害值
        this.tickInterval = data.tickInterval || 0; // 伤害间隔（毫秒）
        this.lastTickTime = Date.now(); // 上次触发时间
    }
    
    // 检查状态是否过期
    isExpired() {
        return Date.now() - this.startTime >= this.duration;
    }
    
    // 获取剩余时间
    getRemainingTime() {
        const elapsed = Date.now() - this.startTime;
        return Math.max(0, this.duration - elapsed);
    }
    
    // 应用状态效果到角色
    applyToCharacter(character) {
        // 这个方法在角色的属性计算中被调用
        return this.effects;
    }
}

// 投射物类
class Projectile {
    constructor(data) {
        this.id = data.id || Math.random().toString(36).substr(2, 9);
        this.icon = data.icon;
        this.x = data.x;
        this.y = data.y;
        this.targetX = data.targetX;
        this.targetY = data.targetY;
        this.speed = data.speed || 100;
        this.damage = data.damage || 0;
        this.source = data.source; // 施法者
        this.maxLifetime = data.maxLifetime || 2000; // 最大存在时间
        this.startTime = Date.now();
        
        // 新技能相关属性
        this.isFireball = data.isFireball || false; // 火球特效
        this.initialSize = data.initialSize || 20;
        this.maxSize = data.maxSize || 30;
        this.isBoomerang = data.isBoomerang || false; // 回旋镖效果
        this.maxDistance = data.maxDistance || 500;
        this.isPenetrating = data.isPenetrating || false; // 穿透效果
        this.damageInterval = data.damageInterval || 0; // 伤害间隔
        this.hitTargets = new Map(); // 记录击中的目标和时间
        this.isReturning = false; // 是否正在返回
        this.traveledDistance = 0; // 已移动距离
        
        // 燃烧状态相关属性
        this.applyBurning = data.applyBurning || false; // 是否施加燃烧状态
        this.burningDamagePercent = data.burningDamagePercent || 0; // 燃烧伤害百分比
        
        // 残影系统
        this.trail = []; // 残影位置数组
        this.maxTrailLength = 8; // 最大残影数量
        this.trailInterval = 20; // 残影生成间隔（毫秒）
        this.lastTrailTime = Date.now();
        
        // 计算移动方向
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.directionX = dx / distance;
            this.directionY = dy / distance;
        } else {
            this.directionX = 0;
            this.directionY = 0;
        }
    }
    
    // 更新投射物位置
    update(deltaTime) {
        const moveDistance = (this.speed * deltaTime) / 1000;
        
        // 回旋镖逻辑
        if (this.isBoomerang) {
            if (!this.isReturning && this.traveledDistance >= this.maxDistance) {
                // 开始返回
                this.isReturning = true;
                const dx = this.source.x - this.x;
                const dy = this.source.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    this.directionX = dx / distance;
                    this.directionY = dy / distance;
                }
            }
            
            // 检查是否返回到施法者位置
            if (this.isReturning) {
                const distanceToSource = Math.sqrt(
                    Math.pow(this.x - this.source.x, 2) + 
                    Math.pow(this.y - this.source.y, 2)
                );
                
                if (distanceToSource <= 30) {
                    // 返回到施法者，标记为过期
                    this.maxLifetime = 0;
                    return;
                }
            }
        }
        
        // 生成残影
        const currentTime = Date.now();
        if (currentTime - this.lastTrailTime >= this.trailInterval) {
            this.trail.push({
                x: this.x,
                y: this.y,
                timestamp: currentTime
            });
            
            // 限制残影数量
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
            
            this.lastTrailTime = currentTime;
        }
        
        this.x += this.directionX * moveDistance;
        this.y += this.directionY * moveDistance;
        
        if (!this.isReturning) {
            this.traveledDistance += moveDistance;
        }
    }
    
    // 检查是否过期
    isExpired() {
        return Date.now() - this.startTime >= this.maxLifetime;
    }
    
    // 检查与目标的碰撞
    checkCollision(target) {
        const distance = Math.sqrt(
            Math.pow(this.x - target.x, 2) + 
            Math.pow(this.y - target.y, 2)
        );
        return distance <= (target.radius || 25);
    }
    
    // 检查是否可以对目标造成伤害（考虑伤害间隔）
    canDamageTarget(target) {
        if (!this.isPenetrating) {
            return true; // 非穿透投射物总是可以造成伤害
        }
        
        const targetId = target.id || target.name;
        const lastHitTime = this.hitTargets.get(targetId);
        const currentTime = Date.now();
        
        if (!lastHitTime || (currentTime - lastHitTime >= this.damageInterval)) {
            this.hitTargets.set(targetId, currentTime);
            return true;
        }
        
        return false;
    }
    
    // 获取当前大小（用于火球放大效果）
    getCurrentSize() {
        if (!this.isFireball) {
            return this.initialSize;
        }
        
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.maxLifetime, 1);
        return this.initialSize + (this.maxSize - this.initialSize) * progress;
    }
}

// 技能类
class Skill {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.icon = data.icon;
        this.description = data.description;
        this.type = data.type; // 'active', 'passive', 'profession', 'special'
        this.effects = data.effects || {}; // 技能效果
        this.cooldown = data.cooldown || 0; // 冷却时间（毫秒）
        this.manaCost = data.manaCost || 100; // 魔法消耗
        this.level = data.level || 1; // 技能等级
        this.maxLevel = data.maxLevel || 5; // 最大等级
        this.conditions = data.conditions || {}; // 触发条件
        this.lastUsed = 0; // 上次使用时间
    }
    
    // 检查技能是否可以使用
    canUse(character) {
        const currentTime = Date.now();
        
        // 检查冷却时间
        if (currentTime - this.lastUsed < this.cooldown) {
            return false;
        }
        
        // 检查魔法值（仅主动技能）
        if (this.type === 'active' && character.currentMana < this.manaCost) {
            return false;
        }
        
        return true;
    }
    
    // 使用技能
    use(character, game) {
        if (!this.canUse(character)) {
            return false;
        }
        
        this.lastUsed = Date.now();
        
        // 消耗魔法值（仅主动技能）
        if (this.type === 'active') {
            character.currentMana = Math.max(0, character.currentMana - this.manaCost);
        }
        
        // 显示技能名浮动文本（仅主动技能）
        if (this.type === 'active' && game && game.showSkillNameText) {
            game.showSkillNameText(character.x, character.y - character.radius - 30, this.name);
        }
        
        // 应用技能效果
        this.applyEffects(character, game);
        
        // 触发被动技能效果（仅主动技能释放后）
        if (this.type === 'active' && game) {
            this.triggerPassiveSkillEffects(character, game);
        }
        
        console.log(`${character.getDisplayName()} 使用了技能: ${this.name}`);
        return true;
    }
    
    // 应用技能效果
    applyEffects(character, game) {
        switch(this.id) {
            case 'savage_charge':
                this.applySavageCharge(character, game);
                break;
            case 'emergency_bandage':
                this.applyEmergencyBandage(character, game);
                break;
            case 'heavy_punch':
                this.applyHeavyPunch(character, game);
                break;
            case 'enrage':
                game.applyEnrage(character, game);
                break;
            case 'flying_daggers':
                this.applyFlyingDaggers(character, game);
                break;
            case 'fireball':
                this.applyFireball(character, game);
                break;
            case 'lightning_strike':
                this.applyLightningStrike(character, game);
                break;
            case 'spike_trap':
                this.applySpikeTrap(character, game);
                break;
            case 'whirlwind_axe':
                this.applyWhirlwindAxe(character, game);
                break;
            case 'soothing_heal':
                this.applySoothingHeal(character, game);
                break;
            case 'rush':
                this.applyRush(character, game);
                break;
            case 'magic_barrier':
                this.applyMagicBarrier(character, game);
                break;
            case 'stomp':
                this.applyStomp(character, game);
                break;
            case 'weakness_curse':
                this.applyWeaknessCurse(character, game);
                break;
        }
    }
    
    // 触发被动技能效果
    triggerPassiveSkillEffects(character, game) {
        // 检查角色装备的被动技能
        character.skills.forEach(skill => {
            if (skill && skill.type === 'passive' && skill.effects) {
                const effects = skill.effects;
                
                // 备用能源：释放主动技能后有50%概率恢复25点魔法值
                if (effects.skillManaRestore) {
                    const { chance, amount } = effects.skillManaRestore;
                    if (Math.random() < chance) {
                        character.currentMana = Math.min(character.maxMana, character.currentMana + amount);
                        console.log(`${character.getDisplayName()} 的备用能源触发，恢复了${amount}点魔法值`);
                        
                        // 显示恢复效果
                        if (game.showHealingNumbers) {
                            game.showFloatingText(character.x, character.y - 20, `+${amount} MP`, '#4CAF50');
                        }
                    }
                }
                
                // 魔力迸发：使所有其他玩家角色恢复15魔法值
                if (effects.teamManaRestore) {
                    const restoreAmount = effects.teamManaRestore;
                    game.characters.forEach(teammate => {
                        if (teammate !== character && !teammate.isDead && teammate.currentMana < teammate.maxMana) {
                            teammate.currentMana = Math.min(teammate.maxMana, teammate.currentMana + restoreAmount);
                            console.log(`${teammate.getDisplayName()} 受到魔力迸发影响，恢复了${restoreAmount}点魔法值`);
                            
                            // 显示恢复效果
                            if (game.showHealingNumbers) {
                                game.showFloatingText(teammate.x, teammate.y - 20, `+${restoreAmount} MP`, '#9C27B0');
                            }
                        }
                    });
                }
            }
        });
    }
    
    // 触发边界碰撞被动技能效果
    
    // 野蛮冲锋效果
    applySavageCharge(character, game) {
        // 找到最近的敌人
        const nearestEnemy = game.findNearestEnemy(character);
        if (!nearestEnemy) {
            console.log('没有找到敌人，无法使用野蛮冲锋');
            return;
        }
        
        // 添加冲锋状态
        const chargeEffect = new StatusEffect({
            id: 'charge',
            name: '冲锋',
            icon: '💨',
            duration: 3000,
            effects: {
                chargeTarget: nearestEnemy,
                chargeSpeed: 50 + character.secondaryAttributes.moveSpeed * 2
            },
            source: character
        });
        
        // 添加防御力增加状态
        const defenseEffect = new StatusEffect({
            id: 'charge_defense',
            name: '冲锋防御',
            icon: '🛡️',
            duration: 3000,
            effects: {
                defenseBonus: 10
            },
            source: character
        });
        
        character.addStatusEffect(chargeEffect);
        character.addStatusEffect(defenseEffect);
        
        console.log(`${character.getDisplayName()} 开始冲锋，目标: ${nearestEnemy.name}`);
    }
    
    // 紧急包扎效果
    applyEmergencyBandage(character, game) {
        // 找到生命值最低的队友
        const lowestHealthAlly = game.findLowestHealthAlly(character);
        if (!lowestHealthAlly) {
            console.log('没有找到需要治疗的队友');
            return;
        }
        
        // 计算治疗量
        const healAmount = 10 + Math.floor(character.secondaryAttributes.attackPower * 0.1);
        
        // 治疗
        const oldHealth = lowestHealthAlly.currentHealth;
        lowestHealthAlly.currentHealth = Math.min(
            lowestHealthAlly.currentHealth + healAmount,
            lowestHealthAlly.maxHealth
        );
        
        // 显示治疗效果（技能图标+数字）
        const actualHealing = lowestHealthAlly.currentHealth - oldHealth;
        if (actualHealing > 0 && game.showHealingNumbers) {
            const skillIcon = '🩹'; // 紧急包扎技能图标
            game.showHealingEffect(
                lowestHealthAlly.x,
                lowestHealthAlly.y - lowestHealthAlly.radius - 15,
                actualHealing,
                skillIcon,
                'skill'
            );
        }
        
        console.log(`${character.getDisplayName()} 治疗了 ${lowestHealthAlly.getDisplayName()}，恢复 ${healAmount} 点生命值`);
    }
    
    // 重拳出击效果
    applyHeavyPunch(character, game) {
        // 找到最近的敌人
        const nearestEnemy = game.findNearestEnemy(character);
        if (!nearestEnemy) {
            console.log('没有找到敌人，无法使用重拳出击');
            return;
        }
        
        // 计算伤害：10 + 自身攻击力 * 50% (降低伤害倍数)
        const damage = 10 + Math.floor(character.secondaryAttributes.attackPower * 0.5);
        
        // 创建投射物
        const projectile = new Projectile({
            icon: '👊',
            x: character.x,
            y: character.y,
            targetX: nearestEnemy.x,
            targetY: nearestEnemy.y,
            speed: 400, // 投射物速度 * 2
            damage: damage,
            source: character,
            maxLifetime: 2000
        });
        
        game.addProjectile(projectile);
        
        console.log(`${character.getDisplayName()} 发射重拳，目标: ${nearestEnemy.name}，伤害: ${damage}`);
    }
    
    // 飞刀射击效果
    applyFlyingDaggers(character, game) {
        // 朝五个不同的随机方向发射5把匕首
        const daggerCount = 5;
        const usedAngles = [];
        
        for (let i = 0; i < daggerCount; i++) {
            // 生成不重复的随机角度
            let angle;
            let attempts = 0;
            do {
                angle = Math.random() * 2 * Math.PI;
                attempts++;
            } while (usedAngles.some(usedAngle => Math.abs(angle - usedAngle) < Math.PI / 6) && attempts < 10);
            
            usedAngles.push(angle);
            
            // 计算目标位置（距离角色500像素）
            const distance = 500;
            const targetX = character.x + Math.cos(angle) * distance;
            const targetY = character.y + Math.sin(angle) * distance;
            
            // 计算伤害：5 + 攻击力 * 85%
            const damage = 5 + Math.floor(character.secondaryAttributes.attackPower * 0.85);
            
            // 计算匕首移动速度：250 + 技巧 * 1
            const speed = 250 + character.attributes.skill;
            
            // 创建匕首投射物
            const dagger = new Projectile({
                icon: '🗡',
                x: character.x,
                y: character.y,
                targetX: targetX,
                targetY: targetY,
                speed: speed,
                damage: damage,
                source: character,
                maxLifetime: 3000 // 最多存在3秒
            });
            
            game.addProjectile(dagger);
        }
        
        console.log(`${character.getDisplayName()} 发射了${daggerCount}把飞刀`);
    }
    
    // 火球术效果
    applyFireball(character, game) {
        // 找到随机敌人
        const enemies = game.enemies.filter(enemy => enemy.currentHealth > 0);
        if (enemies.length === 0) {
            console.log('没有找到敌人，无法使用火球术');
            return;
        }
        
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        
        // 计算伤害：6 + 攻击力 * 160%
        const damage = 6 + Math.floor(character.secondaryAttributes.attackPower * 1.6);
        
        // 计算火球移动速度：(280 + 技巧 * 1) * 1.5 = 增加50%
        const baseSpeed = 280 + character.attributes.skill;
        const speed = baseSpeed * 1.5;
        
        // 创建火球投射物
        const fireball = new Projectile({
            icon: '🔥',
            x: character.x,
            y: character.y,
            targetX: randomEnemy.x,
            targetY: randomEnemy.y,
            speed: speed,
            damage: damage,
            source: character,
            maxLifetime: 4000, // 最多存在4秒
            isFireball: true, // 标记为火球，用于特殊效果
            initialSize: character.radius, // 初始大小
            maxSize: character.radius * 1.5, // 最大大小（150%）
            applyBurning: true, // 标记需要施加燃烧状态
            burningDamagePercent: 0.25 // 燃烧伤害为施法者攻击力的25%
        });
        
        game.addProjectile(fireball);
        
        console.log(`${character.getDisplayName()} 发射火球，目标: ${randomEnemy.name}，伤害: ${damage}，速度: ${speed.toFixed(1)}`);
    }
    
    // 雷击术效果
    applyLightningStrike(character, game) {
        // 找到随机敌人
        const enemies = game.enemies.filter(enemy => enemy.currentHealth > 0);
        if (enemies.length === 0) {
            console.log('没有找到敌人，无法使用雷击术');
            return;
        }
        
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        
        // 计算伤害：攻击力 * 250%
        const damage = Math.floor(character.secondaryAttributes.attackPower * 2.5);
        
        // 直接造成伤害
        const actualDamage = game.calculateDamage(damage, randomEnemy.defense);
        randomEnemy.currentHealth -= actualDamage;
        
        // 显示伤害数字
        game.showDamageNumber(randomEnemy.x, randomEnemy.y - randomEnemy.radius - 10, actualDamage, 'player');
        
        // 在目标头顶生成雷击符号
        game.addLightningEffect(randomEnemy.x, randomEnemy.y - randomEnemy.radius - 20);
        
        // 检查敌人是否死亡
        if (randomEnemy.currentHealth <= 0) {
            game.handleEnemyDeath(randomEnemy, character);
        }
        
        console.log(`${character.getDisplayName()} 对 ${randomEnemy.name} 使用雷击术，造成 ${actualDamage} 伤害`);
    }
    
    // 尖刺陷阱效果
    applySpikeTrap(character, game) {
        // 在随机位置生成陷阱
        const trapX = Math.random() * (game.canvas.width - 200) + 100;
        const trapY = Math.random() * (game.canvas.height - 200) + 100;
        
        // 基础半径100像素，技巧每点增加2%
        const baseRadius = 100;
        const skillBonus = character.attributes.skill * 0.02;
        const trapRadius = Math.floor(baseRadius * (1 + skillBonus));
        
        // 创建陷阱对象
        const trap = {
            x: trapX,
            y: trapY,
            radius: trapRadius,
            creator: character,
            startTime: Date.now(),
            duration: 12000, // 持续12秒（原7秒+5秒）
            lastDamageTime: 0,
            damageInterval: 1000 // 每1秒造成伤害（原0.5秒）
        };
        
        // 添加到游戏的陷阱列表
        if (!game.spikeTraps) {
            game.spikeTraps = [];
        }
        game.spikeTraps.push(trap);
        
        console.log(`${character.getDisplayName()} 在 (${Math.round(trapX)}, ${Math.round(trapY)}) 放置了尖刺陷阱，半径: ${trapRadius}，持续12秒`);
    }
    
    // 旋风飞斧效果
    applyWhirlwindAxe(character, game) {
        // 找到最近的敌人
        const nearestEnemy = game.findNearestEnemy(character);
        if (!nearestEnemy) {
            console.log('没有找到敌人，无法使用旋风飞斧');
            return;
        }
        
        // 计算伤害：5 + 攻击力 * 80%
        const damage = 5 + Math.floor(character.secondaryAttributes.attackPower * 0.8);
        
        // 创建旋风飞斧投射物
        const axe = new Projectile({
            icon: '🪓',
            x: character.x,
            y: character.y,
            targetX: nearestEnemy.x,
            targetY: nearestEnemy.y,
            speed: 400,
            damage: damage,
            source: character,
            maxLifetime: 4000,
            isBoomerang: true, // 标记为回旋镖类型
            maxDistance: 700, // 最大飞行距离（增加100%）
            isPenetrating: true, // 穿透敌人
            damageInterval: 1000, // 对同一敌人每1秒最多造成一次伤害
            sizeMultiplier: 1.3 // 图标大小增加30%
        });
        
        game.addProjectile(axe);
        
        console.log(`${character.getDisplayName()} 发射旋风飞斧，目标: ${nearestEnemy.name}，伤害: ${damage}`);
    }
    
    // 舒缓治疗效果
    applySoothingHeal(character, game) {
        // 找到随机玩家角色 - 使用更宽松的过滤条件
        const playerCharacters = game.battleTeam.filter(char => char && !char.isDead);
        if (playerCharacters.length === 0) {
            console.log('没有找到可治疗的玩家角色');
            return;
        }
        
        const randomPlayer = playerCharacters[Math.floor(Math.random() * playerCharacters.length)];
        
        // 创建治疗区域
        const healingZone = {
            x: randomPlayer.x,
            y: randomPlayer.y,
            radius: 180,
            creator: character,
            startTime: Date.now(),
            duration: 7000, // 持续7秒
            lastHealTime: 0,
            healInterval: 500 // 每0.5秒治疗一次
        };
        
        // 添加到游戏的治疗区域列表
        if (!game.healingZones) {
            game.healingZones = [];
        }
        game.healingZones.push(healingZone);
        
        console.log(`${character.getDisplayName()} 在 ${randomPlayer.getDisplayName()} 位置创建了治疗区域`);
    }
    
    // 奔腾效果
    applyRush(character, game) {
        // 找到随机2名玩家角色 - 使用更宽松的过滤条件
        const playerCharacters = game.battleTeam.filter(char => char && !char.isDead);
        if (playerCharacters.length === 0) {
            console.log('没有找到可加速的玩家角色');
            return;
        }
        
        // 随机选择最多2名角色
        const selectedCharacters = [];
        const availableChars = [...playerCharacters];
        
        for (let i = 0; i < Math.min(2, availableChars.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableChars.length);
            selectedCharacters.push(availableChars.splice(randomIndex, 1)[0]);
        }
        
        selectedCharacters.forEach(targetChar => {
            // 计算加速数值：200 + 敏捷 * 100%
            const speedBonus = 200 + character.attributes.agility;
            
            // 计算护盾数值：50 + 技巧 * 100%
            const shieldValue = 50 + character.attributes.skill;
            
            // 添加加速效果
            const speedEffect = new StatusEffect({
                id: 'rush_speed',
                name: '奔腾加速',
                icon: '🏃‍',
                duration: 5000,
                effects: {
                    moveSpeedBonus: speedBonus
                },
                source: character
            });
            
            // 添加护盾效果
            const shieldEffect = new StatusEffect({
                id: 'rush_shield',
                name: '奔腾护盾',
                icon: '🛡',
                duration: 5000,
                effects: {
                    shield: shieldValue
                },
                source: character
            });
            
            // 确保角色有addStatusEffect方法
            if (typeof targetChar.addStatusEffect === 'function') {
                targetChar.addStatusEffect(speedEffect);
                targetChar.addStatusEffect(shieldEffect);
            } else {
                // 如果没有方法，直接添加到statusEffects数组
                if (!targetChar.statusEffects) {
                    targetChar.statusEffects = [];
                }
                targetChar.statusEffects.push(speedEffect);
                targetChar.statusEffects.push(shieldEffect);
            }
            
            // 添加拖尾特效
            targetChar.rushTrailEffect = {
                startTime: Date.now(),
                duration: 5000,
                size: targetChar.radius * 0.75
            };
        });
        
        console.log(`${character.getDisplayName()} 对 ${selectedCharacters.length} 名角色使用了奔腾技能`);
    }
    
    // 魔法屏障效果
    applyMagicBarrier(character, game) {
        // 对所有玩家角色施加护盾 - 使用更宽松的过滤条件
        const playerCharacters = game.battleTeam.filter(char => char && !char.isDead);
        if (playerCharacters.length === 0) {
            console.log('没有找到可保护的玩家角色');
            return;
        }
        
        // 计算护盾数值：30 + 智慧 * 100%
        const shieldValue = 30 + character.attributes.intelligence;
        
        playerCharacters.forEach(targetChar => {
            const shieldEffect = new StatusEffect({
                id: 'magic_barrier',
                name: '魔法屏障',
                icon: '🛡',
                duration: 7000,
                effects: {
                    shield: shieldValue
                },
                source: character
            });
            
            // 确保角色有addStatusEffect方法
            if (typeof targetChar.addStatusEffect === 'function') {
                targetChar.addStatusEffect(shieldEffect);
            } else {
                // 如果没有方法，直接添加到statusEffects数组
                if (!targetChar.statusEffects) {
                    targetChar.statusEffects = [];
                }
                targetChar.statusEffects.push(shieldEffect);
            }
        });
        
        console.log(`${character.getDisplayName()} 为 ${playerCharacters.length} 名角色施加了魔法屏障，护盾值: ${shieldValue}`);
    }
    
    // 践踏效果
    applyStomp(character, game) {
        // 计算伤害：10 + 攻击力 * 105% + 力量 * 25%
        const damage = 10 + Math.floor(character.secondaryAttributes.attackPower * 1.05) + Math.floor(character.attributes.strength * 0.25);
        
        // 创建践踏区域效果
        const stompEffect = {
            x: character.x,
            y: character.y,
            radius: 210, // 缩小30%：300 * 0.7 = 210
            damage: damage,
            creator: character,
            startTime: Date.now(),
            duration: 1500, // 1.5秒内淡出
            hasDealtDamage: false
        };
        
        // 添加到游戏的践踏效果列表
        if (!game.stompEffects) {
            game.stompEffects = [];
        }
        game.stompEffects.push(stompEffect);
        
        // 立即对范围内的敌人造成伤害
        game.enemies.forEach(enemy => {
            const distance = Math.sqrt(
                Math.pow(enemy.x - character.x, 2) + 
                Math.pow(enemy.y - character.y, 2)
            );
            
            if (distance <= 210) { // 使用新的半径210
                const actualDamage = game.calculateDamage(damage, enemy.defense);
                enemy.currentHealth -= actualDamage;
                
                // 显示伤害数字
                game.showDamageNumber(enemy.x, enemy.y - enemy.radius - 10, actualDamage, 'player');
                
                // 检查敌人是否死亡
                if (enemy.currentHealth <= 0) {
                    game.handleEnemyDeath(enemy, character);
                }
            }
        });
        
        console.log(`${character.getDisplayName()} 使用践踏，造成 ${damage} 伤害`);
    }
    
    // 虚弱诅咒效果
    applyWeaknessCurse(character, game) {
        // 找到随机3名敌人
        const enemies = game.enemies.filter(enemy => enemy.currentHealth > 0);
        if (enemies.length === 0) {
            console.log('没有找到敌人，无法使用虚弱诅咒');
            return;
        }
        
        // 随机选择最多3名敌人
        const selectedEnemies = [];
        const availableEnemies = [...enemies];
        
        for (let i = 0; i < Math.min(3, availableEnemies.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableEnemies.length);
            selectedEnemies.push(availableEnemies.splice(randomIndex, 1)[0]);
        }
        
        selectedEnemies.forEach(enemy => {
            // 添加虚弱诅咒效果
            const curseEffect = new StatusEffect({
                id: 'weakness_curse',
                name: '虚弱诅咒',
                icon: '💔',
                duration: 7000,
                effects: {
                    attackPowerMultiplier: 0.5, // 减少50%攻击力
                    defenseMultiplier: 0.5, // 减少50%防御力
                    moveSpeedMultiplier: 0.5 // 减少50%移动速度
                },
                source: character
            });
            
            // 为敌人添加状态效果（需要确保敌人也有状态效果系统）
            if (!enemy.statusEffects) {
                enemy.statusEffects = [];
            }
            enemy.statusEffects.push(curseEffect);
            
            // 添加头顶符号效果
            enemy.curseSymbol = {
                startTime: Date.now(),
                duration: 7000,
                icon: '💔'
            };
        });
        
        console.log(`${character.getDisplayName()} 对 ${selectedEnemies.length} 名敌人施加了虚弱诅咒`);
    }
    
    // 获取技能类型显示文本
    getTypeText() {
        const typeTexts = {
            'active': '主动技能',
            'passive': '被动技能',
            'profession': '职业技能',
            'special': '特殊技能'
        };
        return typeTexts[this.type] || '未知类型';
    }
    
    // 获取技能等级显示
    getLevelText() {
        return `Lv.${this.level}/${this.maxLevel}`;
    }
    
    // 获取冷却时间显示
    getCooldownText() {
        if (this.cooldown === 0) return '无冷却';
        return `冷却: ${this.cooldown / 1000}秒`;
    }
}

// 技能预设
class SkillPresets {
    static getPreset(skillId) {
        const presets = {
            'savage_charge': {
                id: 'savage_charge',
                name: '野蛮冲锋',
                icon: '💨',
                description: '朝最近的一名敌人发起冲锋，同时自身暂时增加10点防御力。',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'emergency_bandage': {
                id: 'emergency_bandage',
                name: '紧急包扎',
                icon: '🩹',
                description: '使一名当前生命值最低的玩家角色恢复10+攻击力*10%的生命值。',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'heavy_punch': {
                id: 'heavy_punch',
                name: '重拳出击',
                icon: '👊',
                description: '朝最近的一名敌人发射拳头造成10+自身攻击力*50%的伤害。',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'enrage': {
                id: 'enrage',
                name: '激怒',
                icon: '😠',
                description: '激怒随机一名队友，使其增加30%攻击力，持续8秒，并恢复25点魔法值。',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'flying_daggers': {
                id: 'flying_daggers',
                name: '飞刀射击',
                icon: '🗡',
                description: '朝五个不同的随机方向发射5把🗡，每把匕首造成5+攻击力85%的伤害',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'fireball': {
                id: 'fireball',
                name: '火球术',
                icon: '🔥',
                description: '朝一个随机敌人发射一个火球造成伤害，伤害数值为：6+攻击力*160%。击中敌人后，为该敌人赋予"燃烧"状态，持续6秒，处于"燃烧"状态的敌人每秒会受到一次伤害，伤害为：施法者攻击力*25%',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'lightning_strike': {
                id: 'lightning_strike',
                name: '雷击术',
                icon: '⚡',
                description: '对关卡区域中随机的一名敌人造成一次伤害，伤害为：攻击力*250%',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'spike_trap': {
                id: 'spike_trap',
                name: '尖刺陷阱',
                icon: '📌',
                description: '在一个随机位置生成一个尖刺陷阱，对其中的敌人每1秒造成1次伤害，伤害为：施法者攻击力*40%。角色主属性中的技巧越高，陷阱的范围越大。陷阱持续12秒。',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'whirlwind_axe': {
                id: 'whirlwind_axe',
                name: '旋风飞斧',
                icon: '🪓',
                description: '朝最近的敌人发射一个🪓并穿透敌人造成伤害，伤害为：5+攻击力*80%，🪓在飞到远处之后会返回角色手中',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'soothing_heal': {
                id: 'soothing_heal',
                name: '舒缓治疗',
                icon: '💚',
                description: '在随机玩家角色的位置生成一片治疗区域，每0.5秒恢复1+攻击力*10%+技巧*25%的生命值。',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'rush': {
                id: 'rush',
                name: '奔腾',
                icon: '🏃‍',
                description: '使随机2名玩家角色获得加速和护盾，加速数值为：200+施法者自身主属性敏捷*100%，技巧越高护盾值越高',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'magic_barrier': {
                id: 'magic_barrier',
                name: '魔法屏障',
                icon: '🛡',
                description: '使所有玩家角色获得抵挡伤害的护盾，护盾值为：30+主属性智慧*100%。持续7秒。',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'stomp': {
                id: 'stomp',
                name: '践踏',
                icon: '👣',
                description: '对周围210像素半径的所有敌人造成一次伤害，伤害为：10+攻击力*105%+主属性力量*25%',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'weakness_curse': {
                id: 'weakness_curse',
                name: '虚弱诅咒',
                icon: '💔',
                description: '随机选择3名敌人进行削弱，减少目标敌人50%攻击力、50%防御力、50%最终移动速度。持续7秒',
                type: 'active',
                manaCost: 100,
                cooldown: 0,
                effects: {},
                level: 1,
                maxLevel: 5
            },
            'tough_skin': {
                id: 'tough_skin',
                name: '皮糙肉厚',
                icon: '💪',
                description: '最大生命值增加20%',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    maxHealthMultiplier: 1.2
                },
                level: 1,
                maxLevel: 1
            },
            'combat_expert': {
                id: 'combat_expert',
                name: '战斗达人',
                icon: '⚔️',
                description: '攻击力增加20%',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    attackPowerMultiplier: 1.2
                },
                level: 1,
                maxLevel: 1
            },
            'athletics_champion': {
                id: 'athletics_champion',
                name: '田径健将',
                icon: '🦶',
                description: '移动速度增加20%',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    moveSpeedMultiplier: 1.2
                },
                level: 1,
                maxLevel: 1
            },
            'natural_science': {
                id: 'natural_science',
                name: '自然学',
                icon: '🌼',
                description: '对资源点造成的伤害增加100%',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    resourceDamageMultiplier: 2.0
                },
                level: 1,
                maxLevel: 1
            },
            'streaking_enthusiast': {
                id: 'streaking_enthusiast',
                name: '裸奔爱好者',
                icon: '🩲',
                description: '自身没有装备护甲类装备时，攻击力和移动速度增加50%',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    conditionalBonus: {
                        condition: 'no_armor',
                        attackPowerMultiplier: 1.5,
                        moveSpeedMultiplier: 1.5
                    }
                },
                level: 1,
                maxLevel: 1
            },
            'backup_energy': {
                id: 'backup_energy',
                name: '备用能源',
                icon: '🔋',
                description: '自身释放主动技能后，有50%概率恢复25点魔法值',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    skillManaRestore: {
                        chance: 0.5,
                        amount: 25
                    }
                },
                level: 1,
                maxLevel: 1
            },
            'turning_technique': {
                id: 'turning_technique',
                name: '转身技巧',
                icon: '🤸‍♂️',
                description: '自身在触碰到关卡区域边缘时，恢复5点生命值',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    boundaryHeal: 5
                },
                level: 1,
                maxLevel: 1
            },
            'giant_killer': {
                id: 'giant_killer',
                name: '巨人杀手',
                icon: '💥',
                description: '对敌人造成伤害时，附加额外伤害。敌人当前生命值越高，附加的额外伤害就越高。',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    percentageDamage: 0.1
                },
                level: 1,
                maxLevel: 1
            },
            'mana_burst': {
                id: 'mana_burst',
                name: '魔力迸发',
                icon: '✨',
                description: '每次角色自身释放主动技能时，使所有其他玩家角色恢复15魔法值',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    teamManaRestore: 15
                },
                level: 1,
                maxLevel: 1
            },
            'gold_digger': {
                id: 'gold_digger',
                name: '淘金者',
                icon: '💰',
                description: '对资源点造成伤害并使其死亡时，获得10~50金币',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    resourceGoldReward: {
                        min: 10,
                        max: 50
                    }
                },
                level: 1,
                maxLevel: 1
            },
            'gigantamax': {
                id: 'gigantamax',
                name: '极巨化',
                icon: '🆙',
                description: '使自身体积增加100%，体重增加50%',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    sizeMultiplier: 2.0,    // 体积增加100%（变为2倍）
                    weightMultiplier: 1.5   // 体重增加50%（变为1.5倍）
                },
                level: 1,
                maxLevel: 1
            },
            'curiosity': {
                id: 'curiosity',
                name: '求知欲',
                icon: '📚',
                description: '使自身经验获取量+20%',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    expGainMultiplier: 1.2  // 经验获取量增加20%
                },
                level: 1,
                maxLevel: 1
            },
            'clumsy_hands': {
                id: 'clumsy_hands',
                name: '毛手毛脚',
                icon: '🤏',
                description: '每次触碰敌人时，随机获得1~10数量的金币',
                type: 'passive',
                manaCost: 0,
                cooldown: 0,
                effects: {
                    enemyTouchGoldReward: {
                        min: 1,
                        max: 10
                    }
                },
                level: 1,
                maxLevel: 1
            }
        };
        
        return presets[skillId] || null;
    }
    
    // 获取所有技能ID
    static getAllSkillIds() {
        return ['savage_charge', 'emergency_bandage', 'heavy_punch', 'enrage', 
                'flying_daggers', 'fireball', 'lightning_strike', 'spike_trap', 
                'whirlwind_axe', 'soothing_heal', 'rush', 'magic_barrier', 
                'stomp', 'weakness_curse', 'tough_skin', 'combat_expert', 
                'athletics_champion', 'natural_science', 'streaking_enthusiast', 
                'backup_energy', 'turning_technique', 'giant_killer', 
                'mana_burst', 'gold_digger', 'gigantamax', 'curiosity', 'clumsy_hands'];
    }
    
    // 根据类型获取技能
    static getSkillsByType(type) {
        const allIds = this.getAllSkillIds();
        return allIds.filter(id => {
            const preset = this.getPreset(id);
            return preset && preset.type === type;
        });
    }
}

// 任务类
class Quest {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.starLevel = data.starLevel; // 1-5星级
        this.rewards = data.rewards; // {gold: 100, items: [], exp: 50}
        this.requirements = data.requirements; // 任务要求
        this.progress = data.progress || {}; // 任务进度
        this.status = data.status || 'available'; // available, accepted, completed, submitted
        this.type = data.type || 'kill'; // kill, collect, deliver等
    }
    
    // 获取星级显示
    getStarDisplay() {
        return '⭐'.repeat(this.starLevel) + '☆'.repeat(5 - this.starLevel);
    }
    
    // 检查任务是否完成
    isCompleted() {
        switch(this.type) {
            case 'kill':
                return (this.progress.killed || 0) >= this.requirements.killCount;
            case 'collect':
                return (this.progress.collected || 0) >= this.requirements.collectCount;
            case 'level':
                return (this.progress.level || 1) >= this.requirements.targetLevel;
            default:
                return false;
        }
    }
    
    // 获取进度文本
    getProgressText() {
        switch(this.type) {
            case 'kill':
                return `击杀进度: ${this.progress.killed || 0}/${this.requirements.killCount}`;
            case 'collect':
                return `收集进度: ${this.progress.collected || 0}/${this.requirements.collectCount}`;
            case 'level':
                return `等级进度: ${this.progress.level || 1}/${this.requirements.targetLevel}`;
            default:
                return '进度未知';
        }
    }
    
    // 获取进度百分比
    getProgressPercentage() {
        switch(this.type) {
            case 'kill':
                const killed = this.progress.killed || 0;
                const killTarget = this.requirements.killCount || 1;
                return Math.min(100, Math.floor((killed / killTarget) * 100));
            case 'collect':
                const collected = this.progress.collected || 0;
                const collectTarget = this.requirements.collectCount || 1;
                return Math.min(100, Math.floor((collected / collectTarget) * 100));
            case 'level':
                const currentLevel = this.progress.level || 1;
                const targetLevel = this.requirements.targetLevel || 1;
                return Math.min(100, Math.floor((currentLevel / targetLevel) * 100));
            default:
                return 0;
        }
    }
    
    // 获取奖励文本
    getRewardText() {
        const rewards = [];
        if (this.rewards.gold) rewards.push(`💰${this.rewards.gold}金币`);
        if (this.rewards.exp) rewards.push(`⭐${this.rewards.exp}经验`);
        if (this.rewards.items && this.rewards.items.length > 0) {
            this.rewards.items.forEach(item => {
                rewards.push(`${item.icon}${item.name}×${item.count || 1}`);
            });
        }
        return rewards.join(', ');
    }
}

// 任务预设
class QuestPresets {
    static getPreset(questId) {
        const presets = {
            'quest_001': {
                id: 'quest_001',
                name: '新手试炼',
                description: '击败3只野狼来证明你的实力。这是每个冒险者必须经历的试炼。',
                starLevel: 1,
                type: 'kill',
                requirements: {
                    killCount: 3,
                    enemyType: '野狼'
                },
                rewards: {
                    gold: 200,
                    items: [
                        { name: '绷带', icon: '🩹', count: 10 },
                        { name: '魔力胶囊', icon: '💊', count: 10 },
                        { name: '经验笔记', icon: '📜', count: 5 }
                    ]
                },
                progress: {
                    killed: 0
                }
            },
            'quest_002': {
                id: 'quest_002',
                name: '收集任务',
                description: '为村庄收集5个脏兮兮的蛋，这些蛋可能孵化出有用的伙伴。',
                starLevel: 2,
                type: 'collect',
                requirements: {
                    collectCount: 5,
                    itemName: '脏兮兮的蛋'
                },
                rewards: {
                    gold: 600,
                    items: [
                        { name: '牛奶', icon: '🥛', count: 2 },
                        { name: '番茄', icon: '🍅', count: 2 },
                        { name: '鸡腿', icon: '🍗', count: 2 },
                        { name: '茶', icon: '🍵', count: 2 }
                    ]
                },
                progress: {
                    collected: 0
                }
            },
            'quest_003': {
                id: 'quest_003',
                name: '成长之路',
                description: '将任意一个角色提升到5级，展现你的培养能力。',
                starLevel: 3,
                type: 'level',
                requirements: {
                    targetLevel: 5
                },
                rewards: {
                    gold: 500,
                    items: [
                        { name: '铜矿石', icon: '🟫', count: 10 },
                        { name: '橡木材', icon: '🪵', count: 10 },
                        { name: '经验笔记', icon: '📜', count: 5 }
                    ]
                },
                progress: {
                    level: 1
                }
            },
            'quest_004': {
                id: 'quest_004',
                name: '野猪猎人',
                description: '野猪群威胁着村庄的安全，击败5只野猪来保护村民。',
                starLevel: 4,
                type: 'kill',
                requirements: {
                    killCount: 5,
                    enemyType: '野猪'
                },
                rewards: {
                    gold: 200,
                    items: [
                        { name: '经验笔记', icon: '📜', count: 10 },
                        { name: '铜矿石', icon: '🪨', count: 5 },
                        { name: '橡木材', icon: '🪵', count: 5 }
                    ]
                },
                progress: {
                    killed: 0
                }
            },
            'quest_005': {
                id: 'quest_005',
                name: '终极挑战',
                description: '击败强大的巨熊，这需要极大的勇气和实力。只有真正的勇士才能完成。',
                starLevel: 5,
                type: 'kill',
                requirements: {
                    killCount: 1,
                    enemyType: '巨熊'
                },
                rewards: {
                    gold: 1500,
                    items: [
                        { name: '绷带', icon: '🩹', count: 10 },
                        { name: '经验笔记', icon: '📜', count: 10 }
                    ]
                },
                progress: {
                    killed: 0
                }
            },
            'quest_006': {
                id: 'quest_006',
                name: '中级挑战',
                description: '击败更强的敌人来证明你的进步，这是成为高级冒险者的必经之路。',
                starLevel: 3,
                type: 'kill',
                requirements: {
                    killCount: 3,
                    enemyType: '野猪'
                },
                rewards: {
                    gold: 800,
                    items: [
                        { name: '经验笔记', icon: '📜', count: 10 },
                        { name: '魔力胶囊', icon: '💊', count: 5 }
                    ]
                },
                progress: {
                    killed: 0
                }
            }
        };
        
        return presets[questId] || null;
    }
    
    // 获取所有任务ID
    static getAllQuestIds() {
        return ['quest_001', 'quest_002', 'quest_003', 'quest_004', 'quest_005', 'quest_006'];
    }
}

// 新BOSS系统管理器
class BossManager {
    constructor(game) {
        this.game = game;
        this.reset();
        
        // BOSS配置
        this.bossConfigs = {
            7: { // 草原关卡
                type: 'bear',
                name: '巨熊王',
                icon: '🐻',
                baseHealth: 500,
                baseAttack: 25,
                baseDefense: 10,
                baseSpeed: 30,
                weight: 50, // 减少50%：100 → 50
                size: 60,
                color: '#8B4513',
                phases: [
                    { healthPercent: 100, abilities: ['roar'] },
                    { healthPercent: 50, abilities: ['roar', 'slam'] },
                    { healthPercent: 25, abilities: ['roar', 'slam', 'berserk'] }
                ]
            },
            8: { // 森林关卡
                type: 'troll',
                name: '森林巨魔',
                icon: '👹',
                baseHealth: 600,
                baseAttack: 30,
                baseDefense: 15,
                baseSpeed: 25,
                weight: 50, // 减少50%：100 → 50
                size: 65,
                color: '#228B22',
                phases: [
                    { healthPercent: 100, abilities: ['smash', 'regenerate'] },
                    { healthPercent: 60, abilities: ['smash', 'regenerate', 'summon'] },
                    { healthPercent: 30, abilities: ['smash', 'regenerate', 'summon', 'rage'] }
                ]
            }
        };
        
        // BOSS能力定义
        this.abilities = {
            roar: { name: '咆哮', cooldown: 12000, effect: 'stun' },
            slam: { name: '重击', cooldown: 10000, damage: 2.0 },
            berserk: { name: '狂暴', cooldown: 15000, effect: 'buff' },
            smash: { name: '粉碎', cooldown: 7000, damage: 1.8 },
            regenerate: { name: '再生', cooldown: 20000, effect: 'heal' },
            summon: { name: '召唤', cooldown: 25000, effect: 'spawn' },
            rage: { name: '愤怒', cooldown: 18000, effect: 'aoe' }
        };
    }
    
    reset() {
        this.currentBoss = null;
        this.bossActive = false;
        this.killCount = 0;
        this.bossSpawnThreshold = 15; // 击杀15个敌人后生成BOSS
        this.lastAbilityTime = {};
        this.currentPhase = 0;
        this.bossId = 0; // 用于唯一标识BOSS
    }
    
    // 检查是否应该生成BOSS
    checkBossSpawn() {
        if (this.bossActive || this.currentBoss) return;
        
        const currentLevel = this.game.currentLevel;
        if (!currentLevel || (currentLevel.id !== 7 && currentLevel.id !== 8)) return;
        
        if (this.killCount >= this.bossSpawnThreshold) {
            this.spawnBoss();
        }
    }
    
    // 生成BOSS
    spawnBoss() {
        const currentLevel = this.game.currentLevel;
        if (!currentLevel || !this.bossConfigs[currentLevel.id]) return;
        
        const config = this.bossConfigs[currentLevel.id];
        this.bossId++;
        
        // 创建BOSS实例
        const boss = new Boss({
            id: `boss_${this.bossId}`,
            type: config.type,
            name: config.name,
            icon: config.icon,
            maxHealth: config.baseHealth,
            currentHealth: config.baseHealth,
            attackPower: config.baseAttack,
            defense: config.baseDefense,
            moveSpeed: config.baseSpeed,
            weight: config.weight,
            size: config.size,
            color: config.color,
            level: Math.max(1, Math.floor(this.killCount / 5)), // 基于击杀数确定等级
            phases: config.phases,
            abilities: config.phases[0].abilities.map(abilityName => ({
                ...this.abilities[abilityName],
                name: abilityName,
                lastUsed: 0
            }))
        });
        
        // 设置BOSS位置
        const spawnPos = this.game.findSafeSpawnPosition(boss, 'enemy');
        if (spawnPos) {
            boss.x = spawnPos.x;
            boss.y = spawnPos.y;
        }
        
        // 设置BOSS移动方向和速度
        const angle = Math.random() * 2 * Math.PI;
        boss.directionX = Math.cos(angle);
        boss.directionY = Math.sin(angle);
        
        // 计算最终移动速度：20 + BOSS移动速度 * 50%
        boss.finalMoveSpeed = 20 + (boss.moveSpeed * 0.5);
        
        // 添加到游戏中
        this.game.enemies.push(boss);
        this.currentBoss = boss;
        this.bossActive = true;
        this.currentPhase = 0;
        this.lastAbilityTime = {};
        
        console.log(`🔥 BOSS生成: ${boss.name} (等级${boss.level}, 生命值${boss.maxHealth})`);
        
        // 显示BOSS出现提示
        this.showBossAlert(boss);
    }
    
    // 显示BOSS出现提示
    showBossAlert(boss) {
        // 创建BOSS出现特效
        if (this.game.showMessage) {
            this.game.showMessage(`⚠️ BOSS出现: ${boss.name}`, 3000, '#FF4444');
        }
    }
    
    // 更新BOSS状态
    update() {
        if (!this.currentBoss || !this.bossActive) return;
        
        // 检查BOSS是否已死亡
        if (this.currentBoss.currentHealth <= 0) {
            console.log('⚠️ BOSS已死亡，停止更新');
            return;
        }
        
        // 检查BOSS是否还在敌人列表中
        if (!this.game.enemies.includes(this.currentBoss)) {
            // 只有在BOSS还活着的情况下才重新添加
            if (this.currentBoss.currentHealth > 0) {
                console.warn('⚠️ BOSS不在敌人列表中但仍存活，重新添加到列表');
                this.game.enemies.push(this.currentBoss);
                // 显示警告消息
                if (this.game.showMessage) {
                    this.game.showMessage('⚠️ BOSS状态已恢复', 1500, '#FFA500');
                }
            } else {
                // BOSS已死亡但状态未清理，执行清理
                console.log('⚠️ 检测到死亡BOSS，执行状态清理');
                this.currentBoss = null;
                this.bossActive = false;
                this.currentPhase = 0;
                this.lastAbilityTime = {};
                return;
            }
        }
        
        // 更新BOSS阶段
        this.updateBossPhase();
        
        // 更新BOSS能力
        this.updateBossAbilities();
        
        // 更新BOSS AI行为
        this.updateBossAI();
    }
    
    // 更新BOSS阶段
    updateBossPhase() {
        const boss = this.currentBoss;
        const healthPercent = (boss.currentHealth / boss.maxHealth) * 100;
        
        const config = this.bossConfigs[this.game.currentLevel.id];
        let newPhase = 0;
        
        for (let i = config.phases.length - 1; i >= 0; i--) {
            if (healthPercent <= config.phases[i].healthPercent) {
                newPhase = i;
                break;
            }
        }
        
        if (newPhase !== this.currentPhase) {
            this.currentPhase = newPhase;
            const phase = config.phases[newPhase];
            
            // 更新BOSS能力
            boss.abilities = phase.abilities.map(abilityName => ({
                ...this.abilities[abilityName],
                name: abilityName,
                lastUsed: this.lastAbilityTime[abilityName] || 0
            }));
            
            console.log(`🔥 BOSS进入第${newPhase + 1}阶段，解锁新能力`);
            if (this.game.showMessage) {
                this.game.showMessage(`${boss.name} 进入第${newPhase + 1}阶段！`, 2000, '#FFD700');
            }
        }
    }
    
    // 更新BOSS能力
    updateBossAbilities() {
        const boss = this.currentBoss;
        if (!boss || boss.currentHealth <= 0) return; // 添加生命值检查
        
        const currentTime = Date.now();
        
        // 检查每个能力的冷却时间
        boss.abilities.forEach(ability => {
            const timeSinceLastUse = currentTime - (this.lastAbilityTime[ability.name] || 0);
            
            if (timeSinceLastUse >= ability.cooldown) {
                // 随机决定是否使用能力（30%概率）
                if (Math.random() < 0.3) {
                    this.useBossAbility(ability);
                }
            }
        });
    }
    
    // 使用BOSS能力
    useBossAbility(ability) {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            console.warn('⚠️ BOSS状态异常，取消技能释放');
            return;
        }
        
        const currentTime = Date.now();
        
        this.lastAbilityTime[ability.name] = currentTime;
        
        console.log(`🔥 ${boss.name} 使用技能: ${ability.name}`);
        
        switch (ability.name) {
            case 'roar':
                this.executeRoar();
                break;
            case 'slam':
                this.executeSlam();
                break;
            case 'berserk':
                this.executeBerserk();
                break;
            case 'smash':
                this.executeSmash();
                break;
            case 'regenerate':
                this.executeRegenerate();
                break;
            case 'summon':
                this.executeSummon();
                break;
            case 'rage':
                this.executeRage();
                break;
        }
    }
    
    executeRoar() {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            console.warn('⚠️ BOSS状态异常，取消咆哮技能');
            return;
        }
        
        // 眩晕附近的角色
        this.game.battleTeam.forEach(character => {
            if (character && !character.isDead) {
                const distance = Math.sqrt(
                    Math.pow(character.x - boss.x, 2) + 
                    Math.pow(character.y - boss.y, 2)
                );
                
                if (distance <= 150) {
                    if (character.addStatusEffect) {
                        character.addStatusEffect({
                            type: 'stun',
                            duration: 3000,
                            effects: { moveSpeed: 0 },
                            source: boss
                        });
                    }
                }
            }
        });
        
        if (this.game.showMessage) {
            this.game.showMessage(`${boss.name} 发出震耳欲聋的咆哮！`, 1500, '#FF9900');
        }
    }
    
    executeSlam() {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            console.warn('⚠️ BOSS状态异常，取消重击技能');
            return;
        }
        
        boss.nextAttackDamage = boss.attackPower * 2.0;
        boss.slamEffect = true;
        
        setTimeout(() => {
            if (boss && boss.currentHealth > 0) { // 延时执行时也要检查
                boss.nextAttackDamage = null;
                boss.slamEffect = false;
            }
        }, 5000);
        
        if (this.game.showMessage) {
            this.game.showMessage(`${boss.name} 准备重击！`, 1500, '#CC0000');
        }
    }
    
    executeBerserk() {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            console.warn('⚠️ BOSS状态异常，取消狂暴技能');
            return;
        }
        
        if (boss.addStatusEffect) {
            boss.addStatusEffect({
                type: 'berserk',
                duration: 10000,
                effects: { 
                    attackPowerMultiplier: 1.5,
                    moveSpeedMultiplier: 1.3
                },
                source: boss
            });
        }
        
        if (this.game.showMessage) {
            this.game.showMessage(`${boss.name} 进入狂暴状态！`, 2000, '#FF0000');
        }
    }
    
    executeSmash() {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            console.warn('⚠️ BOSS状态异常，取消粉碎技能');
            return;
        }
        
        // 创建范围攻击效果
        this.game.battleTeam.forEach(character => {
            if (character && !character.isDead) {
                const distance = Math.sqrt(
                    Math.pow(character.x - boss.x, 2) + 
                    Math.pow(character.y - boss.y, 2)
                );
                
                if (distance <= 100) {
                    const damage = Math.floor(boss.attackPower * 1.8);
                    character.currentHealth -= damage;
                    if (this.game.showDamageNumber) {
                        this.game.showDamageNumber(character.x, character.y - 20, damage, 'boss');
                    }
                }
            }
        });
        
        if (this.game.showMessage) {
            this.game.showMessage(`${boss.name} 粉碎大地！`, 1500, '#8B4513');
        }
    }
    
    executeRegenerate() {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            console.warn('⚠️ BOSS状态异常，取消恢复技能');
            return;
        }
        
        const healAmount = Math.floor(boss.maxHealth * 0.15);
        
        boss.currentHealth = Math.min(boss.maxHealth, boss.currentHealth + healAmount);
        if (this.game.showDamageNumber) {
            this.game.showDamageNumber(boss.x, boss.y - 30, healAmount, 'heal');
        }
        
        if (this.game.showMessage) {
            this.game.showMessage(`${boss.name} 恢复了生命力！`, 1500, '#00FF00');
        }
    }
    
    executeSummon() {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            console.warn('⚠️ BOSS状态异常，取消召唤技能');
            return;
        }
        
        // 召唤2-3个小怪
        const summonCount = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < summonCount; i++) {
            const minionType = this.game.currentLevel.id === 7 ? 'wolf' : 'skeleton';
            const minion = new Enemy(EnemyPresets.getPreset(minionType));
            
            // 设置召唤物位置
            const angle = (Math.PI * 2 / summonCount) * i;
            minion.x = boss.x + Math.cos(angle) * 80;
            minion.y = boss.y + Math.sin(angle) * 80;
            
            // 确保在边界内
            minion.x = Math.max(minion.radius, Math.min(this.game.canvas.width - minion.radius, minion.x));
            minion.y = Math.max(minion.radius, Math.min(this.game.canvas.height - minion.radius, minion.y));
            
            minion.isSummoned = true; // 标记为召唤物
            this.game.enemies.push(minion);
        }
        
        if (this.game.showMessage) {
            this.game.showMessage(`${boss.name} 召唤了援军！`, 1500, '#9932CC');
        }
    }
    
    executeRage() {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            console.warn('⚠️ BOSS状态异常，取消狂怒技能');
            return;
        }
        
        // 全屏范围攻击
        this.game.battleTeam.forEach(character => {
            if (character && !character.isDead) {
                const damage = Math.floor(boss.attackPower * 1.2);
                character.currentHealth -= damage;
                if (this.game.showDamageNumber) {
                    this.game.showDamageNumber(character.x, character.y - 20, damage, 'boss');
                }
                
                // 添加燃烧效果
                if (character.addStatusEffect) {
                    character.addStatusEffect({
                        type: 'burn',
                        duration: 5000,
                        effects: { damagePerSecond: 5 },
                        source: boss
                    });
                }
            }
        });
        
        if (this.game.showMessage) {
            this.game.showMessage(`${boss.name} 愤怒爆发！`, 2000, '#FF4500');
        }
    }
    
    // 更新BOSS AI行为
    updateBossAI() {
        const boss = this.currentBoss;
        // 检查BOSS是否存在、存活，且在敌人列表中
        if (!boss || boss.currentHealth <= 0 || !this.game.enemies.includes(boss)) {
            return;
        }
        
        // 正常AI行为：追击最近的玩家
        const target = this.findNearestPlayer();
        if (target) {
            const dx = target.x - boss.x;
            const dy = target.y - boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 50) { // 保持一定距离
                boss.directionX = dx / distance;
                boss.directionY = dy / distance;
            } else {
                // 随机移动
                const angle = Math.random() * Math.PI * 2;
                boss.directionX = Math.cos(angle);
                boss.directionY = Math.sin(angle);
            }
        }
    }
    
    // 寻找最近的玩家
    findNearestPlayer() {
        let nearestPlayer = null;
        let nearestDistance = Infinity;
        
        this.game.battleTeam.forEach(character => {
            if (character && !character.isDead && character.x !== undefined) {
                const distance = Math.sqrt(
                    Math.pow(character.x - this.currentBoss.x, 2) + 
                    Math.pow(character.y - this.currentBoss.y, 2)
                );
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPlayer = character;
                }
            }
        });
        
        return nearestPlayer;
    }
    
    // 处理敌人死亡
    onEnemyKilled(enemy) {
        if (enemy === this.currentBoss) {
            this.onBossDefeated();
        } else if (!enemy.isSummoned && !this.bossActive) {
            // 只有非召唤物且BOSS不存在时才计入击杀数
            this.killCount++;
            this.checkBossSpawn();
        }
    }
    
    // BOSS被击败
    onBossDefeated() {
        const boss = this.currentBoss;
        
        console.log(`🎉 BOSS ${boss.name} 被击败！`);
        
        // 给予丰厚奖励
        this.giveDefeatRewards();
        
        // 重置BOSS状态
        this.currentBoss = null;
        this.bossActive = false;
        this.currentPhase = 0;
        this.lastAbilityTime = {};
        
        // 重置击杀进度为0
        this.killCount = 0;
        
        // 增加击杀阈值，下次BOSS更难出现
        this.bossSpawnThreshold += 5;
        
        if (this.game.showMessage) {
            this.game.showMessage(`🎉 ${boss.name} 被击败！获得丰厚奖励！`, 3000, '#FFD700');
        }
    }
    
    // 给予击败BOSS的奖励
    giveDefeatRewards() {
        const boss = this.currentBoss;
        
        // 金币奖励
        const goldReward = 500 + (boss.level * 50);
        this.game.gold += goldReward;
        
        // 经验奖励
        const expReward = 200 + (boss.level * 20);
        this.game.battleTeam.forEach(character => {
            if (character && !character.isDead) {
                this.game.giveExperience(character, expReward);
            }
        });
        
        // 物品奖励
        this.giveBossDrops();
        
        console.log(`🎁 BOSS奖励: ${goldReward}金币, ${expReward}经验值`);
    }
    
    // BOSS掉落物品
    giveBossDrops() {
        const bossDrops = []; // 存储所有BOSS掉落物品
        
        // 1. 从所有技能书预制体库中随机获得其中一个技能书
        const skillBookIds = [
            'savage_charge_book', 'heavy_punch_book', 'emergency_bandage_book', 'enrage_book',
            'flying_daggers_book', 'fireball_book', 'lightning_strike_book', 'spike_trap_book',
            'whirlwind_axe_book', 'soothing_heal_book', 'rush_book', 'magic_barrier_book',
            'stomp_book', 'weakness_curse_book'
        ];
        
        const randomSkillBookId = skillBookIds[Math.floor(Math.random() * skillBookIds.length)];
        
        try {
            const skillBookPreset = ItemPresets.getPreset(randomSkillBookId);
            const skillBookItem = new Item(skillBookPreset);
            this.game.inventory.push(skillBookItem);
            bossDrops.push(skillBookItem);
            console.log(`🎁 BOSS掉落技能书: ${skillBookItem.name}`);
        } catch (error) {
            console.warn('添加技能书失败:', error);
        }
        
        // 2. 获得一个蛋类型的物品，95%概率为"光滑的蛋"，5%概率为"坚硬的蛋"
        const eggRandom = Math.random();
        const eggType = eggRandom < 0.95 ? 'smooth_egg' : 'hard_egg';
        
        try {
            const eggPreset = ItemPresets.getPreset(eggType);
            const eggItem = new Egg(eggPreset);
            this.game.inventory.push(eggItem);
            bossDrops.push(eggItem);
            console.log(`🎁 BOSS掉落蛋: ${eggItem.name} (概率: ${eggRandom < 0.95 ? '95%' : '5%'})`);
        } catch (error) {
            console.warn('添加蛋失败:', error);
        }
        
        // 3. 从"肉排"、"冰淇淋"、"啤酒"、"香蕉"这四种食物物品中随机获得1个
        const foodTypes = ['steak', 'ice_cream', 'beer', 'banana'];
        const randomFoodType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        
        try {
            const foodPreset = ItemPresets.getPreset(randomFoodType);
            const foodItem = new Item(foodPreset);
            this.game.inventory.push(foodItem);
            bossDrops.push(foodItem);
            console.log(`🎁 BOSS掉落食物: ${foodItem.name}`);
        } catch (error) {
            console.warn('添加食物失败:', error);
        }
        
        // 4. 获得200+BOSS等级*5数量的金币
        const boss = this.currentBoss;
        const bossLevel = boss ? boss.level : 1;
        const goldAmount = 200 + bossLevel * 5;
        
        this.game.gold += goldAmount;
        console.log(`🎁 BOSS掉落金币: ${goldAmount} (基础200 + 等级${bossLevel}×5)`);
        
        // 将所有掉落物品添加到本关掉落物追踪系统
        bossDrops.forEach(item => {
            // 添加到本关掉落物追踪
            this.game.levelDrops.push({
                item: item,
                timestamp: Date.now(),
                source: 'BOSS'
            });
            
            // 在关卡区域左下角显示掉落物通知
            this.game.showLevelDropNotification(item);
        });
        
        // 显示BOSS掉落总结通知
        this.showBossDropSummary(bossDrops, goldAmount);
        
        // 显示掉落总结
        const skillBookName = ItemPresets.getPreset(randomSkillBookId)?.name || '未知技能书';
        const eggName = ItemPresets.getPreset(eggType)?.name || '未知蛋';
        const foodName = ItemPresets.getPreset(randomFoodType)?.name || '未知食物';
        
        console.log(`🎉 BOSS掉落总结: ${skillBookName}, ${eggName}, ${foodName}, ${goldAmount}金币`);
    }
    
    // 显示BOSS掉落总结通知
    showBossDropSummary(items, goldAmount) {
        // 创建BOSS掉落总结通知
        const notification = document.createElement('div');
        notification.className = 'boss-drop-summary-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #333;
            padding: 20px 25px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
            z-index: 2000;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            border: 3px solid #FF8C00;
            animation: bossDropAppear 0.5s ease-out;
        `;
        
        const itemsHtml = items.map(item => 
            `<div style="margin: 5px 0; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 20px; margin-right: 8px;">${item.icon}</span>
                <span style="color: ${item.getRarityColor()};">${item.name}</span>
            </div>`
        ).join('');
        
        notification.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 10px; color: #8B0000;">🏆 BOSS 击败奖励</div>
            ${itemsHtml}
            <div style="margin-top: 10px; font-size: 16px; color: #8B0000;">💰 ${goldAmount} 金币</div>
            <div style="margin-top: 15px; font-size: 12px; color: #666;">点击任意位置关闭</div>
        `;
        
        document.body.appendChild(notification);
        
        // 点击关闭
        const closeNotification = () => {
            notification.style.animation = 'bossDropDisappear 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };
        
        notification.addEventListener('click', closeNotification);
        
        // 5秒后自动关闭
        setTimeout(closeNotification, 5000);
    }
    
    // 绘制BOSS特效
    drawBossEffects(ctx, boss) {
        if (!boss || boss !== this.currentBoss) return;
        
        // 绘制BOSS光环
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius + 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        
        // 绘制BOSS标识
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', boss.x, boss.y - boss.radius - 25);
        
        // 绘制阶段指示器
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#FF6666';
        ctx.fillText(`第${this.currentPhase + 1}阶段`, boss.x, boss.y - boss.radius - 10);
        
        // 移除粗大的绿色血条，只保留头像下方的红色血条
        // this.drawBossHealthBar(ctx, boss); // 已移除
    }
    
    // 绘制BOSS生命值条 - 移除粗大的绿色血条，只保留头像下方的红色血条
    drawBossHealthBar(ctx, boss) {
        // 移除原有的粗大血条显示
        // 只保留BOSS名称显示
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, boss.x, boss.y - boss.radius - 10);
    }
}

// BOSS类
class Boss extends Enemy {
    constructor(config) {
        super(config);
        this.isBoss = true;
        this.phases = config.phases || [];
        this.abilities = config.abilities || [];
        this.size = config.size || 50;
        this.color = config.color || '#FF0000';
        
        // BOSS特有属性
        this.nextAttackDamage = null;
        this.slamEffect = false;
        
        // 设置BOSS的基础属性削弱（至少75%削弱）
        this.maxHealth = Math.floor(this.maxHealth * (0.25 - this.level * 0.01)); // 75%削弱，等级越高削弱越多
        this.maxHealth = Math.max(1, this.maxHealth); // 确保最低生命值为1
        this.currentHealth = this.maxHealth;
        this.attackPower = Math.floor(this.attackPower * 0.5); // 50%削弱
        this.attackPower = Math.max(1, this.attackPower); // 确保最低攻击力为1
        this.radius = this.size / 2;
    }
    
    // 重写攻击方法
    getAttackDamage() {
        let damage = this.nextAttackDamage || this.attackPower;
        
        // 应用状态效果
        const berserkEffect = this.getStatusEffect && this.getStatusEffect('berserk');
        if (berserkEffect) {
            damage *= berserkEffect.effects.attackPowerMultiplier;
        }
        
        return Math.floor(damage);
    }
    
    // 重写移动速度
    getMoveSpeed() {
        let speed = this.finalMoveSpeed || this.moveSpeed;
        
        const berserkEffect = this.getStatusEffect && this.getStatusEffect('berserk');
        if (berserkEffect) {
            speed *= berserkEffect.effects.moveSpeedMultiplier;
        }
        
        return speed;
    }
}

// 游戏主类
class Game {
    constructor() {
        try {
            console.log('Game initializing...');
            
            // 初始化标志
            this.isInitialized = false;
            this.gameLoopRunning = false;
            this.gameLoopId = null;
            this.gameLoopWatchdog = null; // 游戏循环看门狗定时器
            
            // 页面可见性状态
            this.isPageHidden = false;
            this.isWindowFocused = true;
            
            // 离线奖励系统
            this.lastActiveTime = Date.now(); // 上次活跃时间
            this.offlineRewards = {
                gold: 0,
                items: []
            };
            
            // 获取画布
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found! Make sure there is a canvas with id="gameCanvas"');
            }
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Failed to get canvas context! Canvas may not be supported');
            }
        
        // 初始化角色
        this.currentCharacter = null; // 初始时不选择任何角色
        
        // 伤害数字系统
        this.damageNumbers = []; // 存储所有伤害数字
        
        // 治疗效果系统
        this.healingEffects = []; // 存储治疗效果（图标+数字）
        this.manaRestoreEffects = []; // 存储魔法恢复效果（图标+数字）
        
        // 粒子系统
        this.particles = []; // 存储所有粒子效果
        
        // 关卡数据
        this.levels = [
            {
                id: 6,
                name: "村庄",
                icon: "🏠",
                description: "宁静祥和的乡村小镇",
                backgroundColor: ['#87CEEB', '#98FB98'],
                elements: [
                    { type: 'house', x: 200, y: 500, width: 120, height: 100 },
                    { type: 'house', x: 500, y: 480, width: 100, height: 120 },
                    { type: 'house', x: 800, y: 520, width: 110, height: 90 },
                    { type: 'road', x: 0, y: 650, width: 1200, height: 50 },
                    { type: 'tree', x: 100, y: 400, size: 60 },
                    { type: 'tree', x: 1000, y: 420, size: 70 },
                    // NPC角色 - 在中心位置等距横向排列
                    { type: 'npc', x: 200, y: 350, npcType: 'merchant', name: '商人', avatar: '👲' },
                    { type: 'npc', x: 200, y: 550, npcType: 'chef', name: '厨子', avatar: '👨‍🍳' },
                    { type: 'npc', x: 300, y: 550, npcType: 'farmer', name: '农夫', avatar: '👩‍🌾' },
                    { type: 'npc', x: 300, y: 350, npcType: 'village_chief', name: '村长', avatar: '👴' },
                    { type: 'npc', x: 400, y: 350, npcType: 'incubator', name: '孵化师', avatar: '👵' },
                    { type: 'npc', x: 500, y: 350, npcType: 'warehouse_manager', name: '仓管员', avatar: '👩' },
                    { type: 'npc', x: 600, y: 350, npcType: 'character_manager', name: '角色管理员', avatar: '👧' },
                    { type: 'npc', x: 700, y: 350, npcType: 'craftsman', name: '手艺人', avatar: '👨🏾' },
                    { type: 'npc', x: 800, y: 350, npcType: 'recorder', name: '记录员', avatar: '👨‍🦳' }
                ]
            },
            {
                id: 7,
                name: "草原",
                icon: "🌼",
                description: "广阔无垠的绿色草原",
                backgroundColor: ['#90EE90', '#32CD32'],
                elements: [
                    { type: 'grassland', x: 0, y: 400, width: 1200, height: 400 },
                    { type: 'flower', x: 200, y: 500, size: 20 },
                    { type: 'flower', x: 400, y: 480, size: 25 },
                    { type: 'flower', x: 600, y: 520, size: 18 },
                    { type: 'flower', x: 800, y: 490, size: 22 },
                    { type: 'flower', x: 1000, y: 510, size: 24 }
                ]
            },
            {
                id: 8,
                name: "森林",
                icon: "🌲",
                description: "茂密深邃的原始森林",
                backgroundColor: ['#006400', '#228B22'],
                elements: [
                    { type: 'tree', x: 100, y: 600, size: 100 },
                    { type: 'tree', x: 300, y: 580, size: 120 },
                    { type: 'tree', x: 500, y: 620, size: 90 },
                    { type: 'tree', x: 700, y: 590, size: 110 },
                    { type: 'tree', x: 900, y: 610, size: 95 },
                    { type: 'tree', x: 1100, y: 600, size: 105 }
                ]
            }
        ];
        
        this.currentLevel = null;
        
        // 初始化物品和蛋系统
        this.inventory = []; // 背包
        this.characters = []; // 角色仓库
        this.currentEgg = null; // 当前查看的蛋
        this.hatchedCharacter = null; // 孵化出的角色
        this.gold = 1000; // 初始金币数量
        
        // 添加初始物品
        this.addInitialItems();
        
        // 初始化敌人系统
        this.enemies = []; // 敌人列表
        this.currentBattle = null; // 当前战斗状态
        this.spawnSwitch = false; // 刷怪开关，默认关闭
        this.maxEnemies = 10; // 最大敌人数量
        this.spawnTimer = null; // 刷怪计时器
        this.lastSpawnTime = 0; // 上次刷怪时间
        this.showEnemyCounter = false; // 敌人计数面板显示状态，默认隐藏
        this.killCount = 0; // 本关击杀计数
        
        // 新BOSS系统
        this.bossManager = new BossManager(this);
        
        // 本关掉落物追踪系统
        this.levelDrops = []; // 本关卡掉落的所有物品
        
        // 战斗面板物品仓库分页系统
        this.battleItemTab = 'consumable'; // 当前选中的物品标签页: 'consumable' 或 'drops'
        this.battleItemPage = 0; // 消耗品页码
        this.battleDropsPage = 0; // 掉落物页码
        
        // 仓库界面状态
        this.warehouseTab = 'foods'; // 'foods'、'eggs'、'materials'、'consumables'、'equipment'、'books'
        this.warehouseFoodPage = 0;
        this.warehouseEggPage = 0;
        this.warehouseMaterialPage = 0;
        this.warehouseConsumablePage = 0;
        this.warehouseEquipmentPage = 0;
        this.warehouseBookPage = 0;
        this.warehouseBookPage = 0;
        this.warehouseEquipmentPage = 0;
        this.warehouseCharacterPage = 0;
        
        // 食物投喂分页状态
        this.currentFoodPage = 0;
        
        // 战斗面板状态
        this.battleTeam = [null, null, null, null]; // 4个编队槽位
        this.battleItemPage = 0; // 消耗品翻页
        
        // 任务系统
        this.availableQuests = []; // 可接取的任务
        this.acceptedQuests = []; // 已接取的任务
        this.completedQuests = []; // 已完成的任务
        this.initQuestSystem(); // 初始化任务系统
        
        // 投射物系统
        this.projectiles = []; // 投射物列表
        
        // 拖尾效果系统
        this.characterTrails = new Map(); // 角色拖尾轨迹记录
        
        // 资源点系统
        this.resourcePoints = []; // 资源点列表
        this.lastResourceSpawnTime = 0; // 上次资源点生成时间
        this.resourceSpawnInterval = 5000; // 资源点生成间隔（5-10秒随机）
        this.maxResourcePoints = { // 各关卡资源点数量上限
            7: 5, // 草原关卡
            8: 6  // 森林关卡
        };
        
        // 农场系统
        this.farmPlots = []; // 10个种植槽（2×5布局）
        for (let i = 0; i < 10; i++) {
            this.farmPlots.push({
                id: i,
                seedId: null,
                seedPreset: null,
                plantTime: null,
                growthDuration: 0,
                isReady: false,
                crop: null
            });
        }
        this.farmRefreshTimer = null; // 农场刷新定时器
        
        // 治疗数字显示控制
        this.showHealingNumbers = true; // 控制是否显示治疗数字，默认显示
        this.showHealthRegenNumbers = false; // 控制是否显示生命恢复数字，默认隐藏
        
        // 掉落物视觉效果系统
        this.itemDropEffects = []; // 存储掉落物视觉效果
        this.levelDropNotifications = []; // 存储关卡区域左下角的掉落物通知
        
        // 金币系统增强
        this.goldPerSecondTimer = 0; // 每秒金币计时器
        this.lastGoldTime = Date.now(); // 上次金币增加时间
        
        // 绑定鼠标和键盘事件
        this.bindGoldEvents();
        this.initLevelPanel();
        this.initCharacterPanel();
        this.initGoldDisplay(); // 初始化金币显示
        
        // 绑定画布点击事件
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // 绑定鼠标移动事件（用于悬停效果）
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasMouseMove(e);
        });
        
        // 设置画布鼠标样式
        this.canvas.style.cursor = 'default';
        
        // 默认加载村庄关卡
        this.loadLevel(6);
        
        // 初始化开发者功能（在DOM完全加载后）
        setTimeout(() => {
            this.initDeveloperFunctions();
            this.initNavbarSaveLoadButtons(); // 初始化导航栏存档按钮
        }, 100);
        
        // 测试随机角色生成
        console.log('测试随机角色生成:');
        const randomChar1 = new Character(CharacterPresets.getPreset('random_strength'));
        const randomChar2 = new Character(CharacterPresets.getPreset('random_agility'));
        const randomChar3 = new Character(CharacterPresets.getPreset('random_intelligence'));
        const randomChar4 = new Character(CharacterPresets.getPreset('random_skill'));
        
        // 给随机角色学习一些基础技能
        this.giveDefaultSkills(randomChar1);
        this.giveDefaultSkills(randomChar2);
        this.giveDefaultSkills(randomChar3);
        this.giveDefaultSkills(randomChar4);
        
        console.log('力量型角色:', randomChar1.getDisplayName(), randomChar1.attributes);
        console.log('敏捷型角色:', randomChar2.getDisplayName(), randomChar2.attributes);
        console.log('智慧型角色:', randomChar3.getDisplayName(), randomChar3.attributes);
        console.log('技巧型角色:', randomChar4.getDisplayName(), randomChar4.attributes);
        
        // 测试敌人系统
        console.log('测试敌人系统:');
        const wolf = new Enemy(EnemyPresets.getPreset('wolf'));
        const boar = new Enemy(EnemyPresets.getPreset('boar'));
        const snake = new Enemy(EnemyPresets.getPreset('snake'));
        const bear = new Enemy(EnemyPresets.getPreset('bear'));
        
        console.log('野狼:', wolf.name, `生命值:${wolf.currentHealth}/${wolf.maxHealth}`, `攻击力:${wolf.attackPower}`, `威胁度:${wolf.getThreatText()}`);
        console.log('野猪:', boar.name, `生命值:${boar.currentHealth}/${boar.maxHealth}`, `攻击力:${boar.attackPower}`, `威胁度:${boar.getThreatText()}`);
        console.log('蟒蛇:', snake.name, `生命值:${snake.currentHealth}/${snake.maxHealth}`, `攻击力:${snake.attackPower}`, `威胁度:${snake.getThreatText()}`);
        console.log('巨熊:', bear.name, `生命值:${bear.currentHealth}/${bear.maxHealth}`, `攻击力:${bear.attackPower}`, `威胁度:${bear.getThreatText()}`);
        
        // 测试随机敌人生成
        const randomEnemy = EnemyPresets.generateRandomEnemy();
        console.log('随机敌人:', randomEnemy.name, randomEnemy.icon, `等级:${randomEnemy.level}`);
        
        console.log('Game initialized successfully');
        
        // 启动游戏循环
        this.startGameLoop();
        
        // 设置页面可见性监听器
        this.setupVisibilityListener();
        
        // 设置初始化完成标志
        this.isInitialized = true;
        console.log('Game initialization complete - isInitialized flag set to true');
        
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.isInitialized = false;
            
            // 显示错误信息到页面
            const panelContent = document.querySelector('.panel-content');
            const controlContent = document.querySelector('.control-content');
            
            const errorMessage = `
                <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin: 10px 0; border: 1px solid #f5c6cb;">
                    <strong>游戏初始化错误:</strong><br>
                    ${error.message}<br>
                    <small>请检查浏览器控制台获取详细信息</small><br>
                    <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            `;
            
            if (panelContent) panelContent.innerHTML = errorMessage;
            if (controlContent) controlContent.innerHTML = errorMessage;
            
            // 重新抛出错误以便全局错误处理器捕获
            throw error;
        }
    }
    
    // 给角色默认技能
    giveDefaultSkills(character) {
        if (character.type !== 'Player') return;
        
        // 所有角色都学会4个新技能
        const skillIds = ['savage_charge', 'emergency_bandage', 'heavy_punch', 'enrage'];
        
        skillIds.forEach((skillId) => {
            character.learnSkill(skillId);
        });
        
        // 只装备到解锁的技能槽
        let equippedCount = 0;
        for (let i = 0; i < 4 && equippedCount < skillIds.length; i++) {
            if (character.isSkillSlotUnlocked(i)) {
                character.equipSkill(skillIds[equippedCount], i);
                equippedCount++;
            }
        }
        
        console.log(`${character.getDisplayName()} 学会了新技能系统的4个技能，装备了 ${equippedCount} 个到解锁的槽位`);
    }
    
    // 获取角色的主属性倾向
    getMainAttribute(character) {
        const attrs = character.attributes;
        const maxValue = Math.max(attrs.strength, attrs.agility, attrs.intelligence, attrs.skill);
        
        if (attrs.strength === maxValue) return 'strength';
        if (attrs.agility === maxValue) return 'agility';
        if (attrs.intelligence === maxValue) return 'intelligence';
        if (attrs.skill === maxValue) return 'skill';
        
        return 'strength'; // 默认
    }
    
    // 初始化任务系统
    initQuestSystem() {
        // 初始化所有可用任务
        const questIds = QuestPresets.getAllQuestIds();
        questIds.forEach(questId => {
            const questData = QuestPresets.getPreset(questId);
            if (questData) {
                const quest = new Quest(questData);
                this.availableQuests.push(quest);
            }
        });
        
        console.log(`任务系统初始化完成，共加载 ${this.availableQuests.length} 个任务`);
    }
    
    // 接取任务
    acceptQuest(questId) {
        const questIndex = this.availableQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            console.log('任务不存在:', questId);
            return false;
        }
        
        const quest = this.availableQuests[questIndex];
        quest.status = 'accepted';
        
        // 从可接取列表移动到已接取列表
        this.availableQuests.splice(questIndex, 1);
        this.acceptedQuests.push(quest);
        
        console.log(`接取任务: ${quest.name}`);
        return true;
    }
    
    // 提交任务
    submitQuest(questId) {
        const questIndex = this.acceptedQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            console.log('任务不存在或未接取:', questId);
            return false;
        }
        
        const quest = this.acceptedQuests[questIndex];
        if (!quest.isCompleted()) {
            console.log('任务未完成，无法提交:', quest.name);
            return false;
        }
        
        // 发放奖励
        this.giveQuestRewards(quest);
        
        // 更新任务状态
        quest.status = 'submitted';
        
        // 从已接取列表移动到已完成列表
        this.acceptedQuests.splice(questIndex, 1);
        this.completedQuests.push(quest);
        
        console.log(`提交任务: ${quest.name}`);
        return true;
    }
    
    // 放弃任务
    abandonQuest(questId) {
        const questIndex = this.acceptedQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            console.log('任务不存在或未接取:', questId);
            return false;
        }
        
        const quest = this.acceptedQuests[questIndex];
        
        // 重置任务状态和进度
        quest.status = 'available';
        quest.progress = {};
        
        // 从已接取列表移回可接取列表
        this.acceptedQuests.splice(questIndex, 1);
        this.availableQuests.push(quest);
        
        console.log(`放弃任务: ${quest.name}`);
        return true;
    }
    
    // 发放任务奖励
    giveQuestRewards(quest) {
        const rewards = quest.rewards;
        
        // 发放金币
        if (rewards.gold) {
            this.gold += rewards.gold;
            this.updateGoldDisplay();
            console.log(`获得金币: ${rewards.gold}`);
        }
        
        // 发放经验（给编队中的角色）
        if (rewards.exp) {
            this.battleTeam.forEach(character => {
                if (character && character.type === 'Player' && !character.isDead) {
                    this.giveExperience(character, rewards.exp);
                }
            });
            console.log(`获得经验: ${rewards.exp}`);
        }
        
        // 发放物品
        if (rewards.items && rewards.items.length > 0) {
            rewards.items.forEach(rewardItem => {
                for (let i = 0; i < (rewardItem.count || 1); i++) {
                    const itemData = ItemPresets.getPreset(this.getItemPresetKey(rewardItem.name));
                    if (itemData) {
                        const item = new Item(itemData);
                        this.inventory.push(item);
                    }
                }
                console.log(`获得物品: ${rewardItem.name} × ${rewardItem.count || 1}`);
            });
        }
    }
    
    // 根据物品名称获取预设键
    getItemPresetKey(itemName) {
        const nameToKey = {
            '脏兮兮的蛋': 'dirty_egg',
            '绷带': 'bandage',
            '魔力胶囊': 'mana_capsule',
            '米饭': 'rice',
            '牛奶': 'milk',
            '番茄': 'tomato',
            '鸡腿': 'chicken_leg',
            '茶': 'tea',
            '《野蛮冲锋》技能书': 'savage_charge_book',
            '《重拳出击》技能书': 'heavy_punch_book',
            '《紧急包扎》技能书': 'emergency_bandage_book',
            '《激怒》技能书': 'enrage_book',
            '《飞刀射击》技能书': 'flying_daggers_book',
            '《火球术》技能书': 'fireball_book',
            '《雷击术》技能书': 'lightning_strike_book',
            '《尖刺陷阱》技能书': 'spike_trap_book',
            '《旋风飞斧》技能书': 'whirlwind_axe_book',
            '《舒缓治疗》技能书': 'soothing_heal_book',
            '《奔腾》技能书': 'rush_book',
            '《魔法屏障》技能书': 'magic_barrier_book',
            '《践踏》技能书': 'stomp_book',
            '《虚弱诅咒》技能书': 'weakness_curse_book'
        };
        return nameToKey[itemName] || 'dirty_egg';
    }
    
    // 更新任务进度
    updateQuestProgress(type, data) {
        this.acceptedQuests.forEach(quest => {
            if (quest.type === type) {
                switch(type) {
                    case 'kill':
                        if (quest.requirements.enemyType === data.enemyType) {
                            quest.progress.killed = (quest.progress.killed || 0) + 1;
                            console.log(`任务进度更新: ${quest.name} - ${quest.getProgressText()}`);
                        }
                        break;
                    case 'collect':
                        if (quest.requirements.itemName === data.itemName) {
                            quest.progress.collected = (quest.progress.collected || 0) + (data.count || 1);
                            console.log(`任务进度更新: ${quest.name} - ${quest.getProgressText()}`);
                        }
                        break;
                    case 'level':
                        const maxLevel = Math.max(...this.characters
                            .filter(char => char.type === 'Player')
                            .map(char => char.level));
                        if (maxLevel > (quest.progress.level || 1)) {
                            quest.progress.level = maxLevel;
                            console.log(`任务进度更新: ${quest.name} - ${quest.getProgressText()}`);
                        }
                        break;
                }
            }
        });
    }
    
    // 显示任务进度面板
    showQuestProgressPanel() {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'quest-progress-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        // 创建面板
        const panel = document.createElement('div');
        panel.className = 'quest-progress-panel';
        panel.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;
        
        // 创建标题
        const title = document.createElement('h2');
        title.textContent = '📋 任务进度';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #333;
            font-size: 24px;
            text-align: center;
        `;
        panel.appendChild(title);
        
        // 获取进行中的任务
        const activeQuests = this.acceptedQuests.filter(q => q.status === 'accepted');
        
        if (activeQuests.length === 0) {
            const noQuest = document.createElement('p');
            noQuest.textContent = '当前没有进行中的任务';
            noQuest.style.cssText = `
                text-align: center;
                color: #666;
                font-size: 16px;
                padding: 40px 0;
            `;
            panel.appendChild(noQuest);
        } else {
            // 显示每个任务的详情
            activeQuests.forEach(quest => {
                const questCard = document.createElement('div');
                questCard.style.cssText = `
                    background: #f9f9f9;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 15px;
                    border-left: 4px solid #667eea;
                `;
                
                // 任务名称和星级
                const questHeader = document.createElement('div');
                questHeader.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                `;
                
                const questName = document.createElement('h3');
                questName.textContent = quest.name;
                questName.style.cssText = `
                    margin: 0;
                    color: #333;
                    font-size: 18px;
                `;
                
                const questStars = document.createElement('span');
                questStars.textContent = '⭐'.repeat(quest.starLevel);
                questStars.style.cssText = `
                    font-size: 16px;
                `;
                
                questHeader.appendChild(questName);
                questHeader.appendChild(questStars);
                questCard.appendChild(questHeader);
                
                // 任务描述
                const questDesc = document.createElement('p');
                questDesc.textContent = quest.description;
                questDesc.style.cssText = `
                    margin: 10px 0;
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                `;
                questCard.appendChild(questDesc);
                
                // 任务进度
                const questProgress = document.createElement('div');
                questProgress.style.cssText = `
                    margin: 15px 0;
                    padding: 10px;
                    background: white;
                    border-radius: 6px;
                `;
                
                const progressText = document.createElement('p');
                progressText.textContent = `进度: ${quest.getProgressText()}`;
                progressText.style.cssText = `
                    margin: 0;
                    color: #333;
                    font-size: 16px;
                    font-weight: bold;
                `;
                questProgress.appendChild(progressText);
                
                // 进度条
                const progressBar = document.createElement('div');
                progressBar.style.cssText = `
                    width: 100%;
                    height: 8px;
                    background: #e0e0e0;
                    border-radius: 4px;
                    margin-top: 8px;
                    overflow: hidden;
                `;
                
                const progressFill = document.createElement('div');
                const percentage = quest.getProgressPercentage();
                progressFill.style.cssText = `
                    width: ${percentage}%;
                    height: 100%;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    transition: width 0.3s ease;
                `;
                progressBar.appendChild(progressFill);
                questProgress.appendChild(progressBar);
                
                questCard.appendChild(questProgress);
                
                // 任务奖励
                const questRewards = document.createElement('div');
                questRewards.style.cssText = `
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #ddd;
                `;
                
                const rewardsLabel = document.createElement('p');
                rewardsLabel.textContent = '奖励:';
                rewardsLabel.style.cssText = `
                    margin: 0 0 8px 0;
                    color: #666;
                    font-size: 14px;
                `;
                questRewards.appendChild(rewardsLabel);
                
                const rewardsText = document.createElement('p');
                rewardsText.textContent = quest.getRewardText();
                rewardsText.style.cssText = `
                    margin: 0;
                    color: #FF8F00;
                    font-size: 14px;
                    font-weight: bold;
                `;
                questRewards.appendChild(rewardsText);
                
                questCard.appendChild(questRewards);
                panel.appendChild(questCard);
            });
        }
        
        // 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 12px;
            margin-top: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s ease;
        `;
        closeBtn.onmouseover = () => closeBtn.style.transform = 'translateY(-2px)';
        closeBtn.onmouseout = () => closeBtn.style.transform = 'translateY(0)';
        closeBtn.onclick = () => document.body.removeChild(overlay);
        panel.appendChild(closeBtn);
        
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        
        // 点击遮罩层关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };
    }
    
    // 初始化关卡选择面板
    initLevelPanel() {
        const panelContent = document.querySelector('.panel-content');
        if (!panelContent) {
            console.error('Panel content not found');
            return;
        }
        
        panelContent.innerHTML = '';
        
        this.levels.forEach(level => {
            const button = document.createElement('button');
            button.className = 'level-button';
            button.dataset.levelId = level.id;
            button.innerHTML = `
                <span class="button-icon">${level.icon}</span>
                <span class="button-name">${level.name}</span>
            `;
            
            button.addEventListener('click', () => {
                this.loadLevel(level.id);
            });
            
            panelContent.appendChild(button);
        });
        
        console.log('Level buttons created');
    }
    
    // 加载关卡
    loadLevel(levelId, options = {}) {
        const level = this.levels.find(l => l.id === levelId);
        if (!level) return;
        
        this.currentLevel = level;
        this.updateLevelButtons(levelId);
        
        // 只有在非保存加载操作时才清除敌人和重置状态
        if (!options.isLoadingFromSave) {
            // 清除现有敌人
            this.enemies = [];
            
            // 清空关卡区域中所有的资源点
            this.resourcePoints = [];
            
            // 重置本关击杀计数
            this.killCount = 0;
            
            // 重置新BOSS系统
            this.bossManager.reset();
            
            // 重置本关掉落物追踪
            this.levelDrops = [];
            
            // 清空编队槽位中的所有角色
            this.clearAllTeamSlots();
        } else {
            console.log('🔄 从存档加载关卡，保持现有游戏状态');
        }
        
        // 根据关卡设置刷怪开关、敌人数量上限和计数面板显示
        if (levelId === 6) { // 村庄关卡
            this.spawnSwitch = false;
            this.maxEnemies = 10;
            this.showEnemyCounter = false; // 隐藏计数面板
            this.stopEnemySpawning();
        } else if (levelId === 7) { // 草原关卡
            this.spawnSwitch = true;
            this.maxEnemies = 15; // 草原关卡敌人上限为15
            this.showEnemyCounter = true; // 显示计数面板
            this.startEnemySpawning();
        } else if (levelId === 8) { // 森林关卡
            this.spawnSwitch = true; // 森林关卡刷怪开关开启
            this.maxEnemies = 10;
            this.showEnemyCounter = true; // 显示计数面板
            this.startEnemySpawning();
        } else {
            // 其他关卡默认设置
            this.spawnSwitch = false;
            this.maxEnemies = 10;
            this.showEnemyCounter = false; // 隐藏计数面板
            this.stopEnemySpawning();
        }
        
        this.drawLevel();
        
        // 根据关卡切换操作面板内容
        if (levelId === 7 || levelId === 8) { // 草原关卡和森林关卡
            this.currentCharacter = null; // 清除当前角色选择
            this.initBattlePanel(); // 显示战斗面板
        } else {
            // 其他关卡保持原有逻辑
            this.initCharacterPanel();
        }
        
        console.log('Level loaded:', level.name, '刷怪开关:', this.spawnSwitch ? '开' : '关', '敌人上限:', this.maxEnemies, '计数面板:', this.showEnemyCounter ? '显示' : '隐藏');
    }
    
    // 更新关卡按钮状态
    updateLevelButtons(activeLevelId) {
        const buttons = document.querySelectorAll('.level-button');
        buttons.forEach(button => {
            if (parseInt(button.dataset.levelId) === activeLevelId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // 绘制关卡
    drawLevel() {
        if (!this.currentLevel || !this.ctx) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        const colors = this.currentLevel.backgroundColor;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制关卡元素 - 村庄关卡特殊处理NPC层级
        if (this.currentLevel.elements) {
            if (this.currentLevel.id === 6) { // 村庄关卡特殊处理
                // 先绘制非NPC元素（房子、道路、树木）
                this.currentLevel.elements.forEach(element => {
                    if (element.type !== 'npc') {
                        this.drawElement(element);
                    }
                });
            } else {
                // 其他关卡正常绘制所有元素
                this.currentLevel.elements.forEach(element => {
                    this.drawElement(element);
                });
            }
        }
        
        // 在不同关卡中绘制对应的背景图片（在关卡元素之后，使背景图片显示在元素之上）
        if (this.currentLevel.id === 7) { // 草原关卡
            this.drawMapBackground();
        } else if (this.currentLevel.id === 8) { // 森林关卡
            this.drawForestBackground();
        } else if (this.currentLevel.id === 6) { // 村庄关卡
            this.drawVillageBackground();
        }
        
        // 村庄关卡：在背景图片之后绘制NPC，使NPC显示层级最高
        if (this.currentLevel.id === 6 && this.currentLevel.elements) {
            this.currentLevel.elements.forEach(element => {
                if (element.type === 'npc') {
                    this.drawElement(element);
                }
            });
        }
        
        // 绘制敌人
        this.enemies.forEach(enemy => {
            this.drawEnemy(enemy);
            
            // 如果是BOSS，绘制特殊效果
            if (enemy.isBoss && this.bossManager) {
                this.bossManager.drawBossEffects(this.ctx, enemy);
            }
        });
        
        // 绘制资源点
        this.resourcePoints.forEach(resourcePoint => {
            this.drawResourcePoint(resourcePoint);
        });
        
        // 绘制角色拖尾效果（在角色之前绘制，作为背景层）
        this.drawCharacterTrails();
        
        // 绘制玩家角色
        this.battleTeam.forEach(character => {
            if (character && character.x !== undefined && character.y !== undefined) {
                this.drawPlayerCharacter(character);
            }
        });
        
        // 绘制敌人计数区域（美化的圆角矩形）- 仅在需要时显示
        if (this.showEnemyCounter) {
            const panelX = 20;
            const panelY = 20;
            const panelWidth = 220;
            const panelHeight = 110; // 增加高度以容纳任务进度按钮
            const cornerRadius = 12;
            
            // 绘制圆角矩形背景
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(panelX + cornerRadius, panelY);
            this.ctx.lineTo(panelX + panelWidth - cornerRadius, panelY);
            this.ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + cornerRadius);
            this.ctx.lineTo(panelX + panelWidth, panelY + panelHeight - cornerRadius);
            this.ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - cornerRadius, panelY + panelHeight);
            this.ctx.lineTo(panelX + cornerRadius, panelY + panelHeight);
            this.ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - cornerRadius);
            this.ctx.lineTo(panelX, panelY + cornerRadius);
            this.ctx.quadraticCurveTo(panelX, panelY, panelX + cornerRadius, panelY);
            this.ctx.closePath();
            
            // 渐变背景（紫色渐变）
            const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)'); // 浅紫色
            gradient.addColorStop(1, 'rgba(118, 75, 162, 0.9)');  // 深紫色
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // 边框（增强可点击视觉效果）
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 内部阴影效果
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.restore();
            
            // 绘制文本
            this.ctx.save();
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            
            // 敌人数量文本（移除🐺图标）
            const enemyCountText = `敌人数量: ${this.enemies.length}/${this.maxEnemies}`;
            this.ctx.fillText(enemyCountText, panelX + 15, panelY + 15);
            
            // 资源点数量文本
            this.ctx.font = '12px Arial';
            const maxResourcePoints = this.maxResourcePoints[this.currentLevel.id] || 0;
            const resourceCountText = `资源点数量: ${this.resourcePoints.length}/${maxResourcePoints}`;
            this.ctx.fillText(resourceCountText, panelX + 15, panelY + 28);
            
            // 本关击杀文本
            const killCountText = `本关击杀: ${this.killCount}`;
            this.ctx.fillText(killCountText, panelX + 15, panelY + 41);
            
            // 刷怪开关文本
            const switchIcon = this.spawnSwitch ? '🟢' : '🔴';
            const switchText = `${switchIcon} 刷怪开关: ${this.spawnSwitch ? '开启' : '关闭'}`;
            this.ctx.fillText(switchText, panelX + 15, panelY + 54);
            
            // BOSS状态文本
            const bossStatus = this.bossManager.bossActive ? '🔥 BOSS已出现' : `击杀进度: ${this.bossManager.killCount}/${this.bossManager.bossSpawnThreshold}`;
            this.ctx.fillText(bossStatus, panelX + 15, panelY + 67);
            
            // 绘制任务进度按钮
            const btnX = panelX + 15;
            const btnY = panelY + 82;
            const btnWidth = 190;
            const btnHeight = 20;
            const btnRadius = 6;
            
            // 按钮背景
            this.ctx.beginPath();
            this.ctx.moveTo(btnX + btnRadius, btnY);
            this.ctx.lineTo(btnX + btnWidth - btnRadius, btnY);
            this.ctx.quadraticCurveTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + btnRadius);
            this.ctx.lineTo(btnX + btnWidth, btnY + btnHeight - btnRadius);
            this.ctx.quadraticCurveTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - btnRadius, btnY + btnHeight);
            this.ctx.lineTo(btnX + btnRadius, btnY + btnHeight);
            this.ctx.quadraticCurveTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - btnRadius);
            this.ctx.lineTo(btnX, btnY + btnRadius);
            this.ctx.quadraticCurveTo(btnX, btnY, btnX + btnRadius, btnY);
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // 按钮文本
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('📋 任务进度', btnX + btnWidth / 2, btnY + btnHeight / 2 + 1);
            
            // 添加点击提示（小手图标）
            if (this.currentLevel && (this.currentLevel.id === 7 || this.currentLevel.id === 8)) { // 在草原关卡和森林关卡显示
                this.ctx.font = '10px Arial';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.textAlign = 'right';
                this.ctx.fillText('👆 点击切换', panelX + panelWidth - 10, panelY + 18);
            }
            
            this.ctx.restore();
        }
        
        // 绘制投射物（在伤害数字之前绘制）
        this.drawProjectiles();
        
        // 绘制新技能效果
        this.drawLightningEffects();
        this.drawSpikeTraps();
        this.drawHealingZones();
        this.drawStompEffects();
        this.drawShieldEffects();
        
        // 绘制粒子效果（在伤害数字之前绘制）
        this.drawParticles();
        
        // 绘制伤害数字（最后绘制，确保在最上层）
        this.drawDamageNumbers();
        
        // 绘制治疗效果（最后绘制，确保在最上层）
        this.drawHealingEffects();
        
        // 绘制魔法恢复效果（最后绘制，确保在最上层）
        this.drawManaRestoreEffects();
        
        // 绘制掉落物效果（最后绘制，确保在最上层）
        this.drawItemDropEffects();
        
        // 绘制关卡区域左下角的掉落物通知
        this.drawLevelDropNotifications();
        
        // 绘制村庄关卡的新手指南区域
        if (this.currentLevel.id === 6) { // 仅在村庄关卡显示
            this.drawVillageGuideArea();
        }
    }
    
    // 开始敌人刷新
    startEnemySpawning() {
        this.stopEnemySpawning(); // 先停止现有的刷新
        
        const spawnEnemy = () => {
            if (this.spawnSwitch && this.enemies.length < this.maxEnemies) {
                this.spawnRandomEnemy();
            }
            
            // 设置下次刷新时间（3-8秒）
            const nextSpawnDelay = (3 + Math.random() * 5) * 1000;
            this.spawnTimer = setTimeout(spawnEnemy, nextSpawnDelay);
        };
        
        // 立即开始第一次刷新
        const initialDelay = (3 + Math.random() * 5) * 1000;
        this.spawnTimer = setTimeout(spawnEnemy, initialDelay);
        
        console.log('敌人刷新系统已启动');
    }
    
    // 停止敌人刷新
    stopEnemySpawning() {
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
        console.log('敌人刷新系统已停止');
    }
    
    // 切换刷怪开关
    toggleSpawnSwitch() {
        // 在草原关卡和森林关卡允许切换开关
        if (this.currentLevel && (this.currentLevel.id === 7 || this.currentLevel.id === 8)) {
            this.spawnSwitch = !this.spawnSwitch;
            
            if (this.spawnSwitch) {
                this.startEnemySpawning();
                console.log('刷怪开关已开启');
            } else {
                this.stopEnemySpawning();
                console.log('刷怪开关已关闭');
            }
            
            // 重绘画面以更新计数面板显示
            this.drawLevel();
        } else {
            console.log('只有在草原关卡和森林关卡才能切换刷怪开关');
        }
    }
    
    // 敌人升级
    levelUpEnemy(enemy, levels) {
        for (let i = 0; i < levels; i++) {
            enemy.level++;
            
            // 每级获得属性点：BOSS获得5点（减少50%），普通敌人获得10点
            const attributePoints = enemy.isBoss ? 5 : 10; // BOSS属性点减少50%
            
            // 如果是BOSS，排除防御力属性
            const attributes = enemy.isBoss 
                ? ['attackPower', 'moveSpeed', 'maxHealth']  // BOSS不分配防御力
                : ['attackPower', 'defense', 'moveSpeed', 'maxHealth'];  // 普通敌人包含防御力
            
            for (let j = 0; j < attributePoints; j++) {
                const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
                
                if (randomAttr === 'maxHealth') {
                    // 最大生命值额外+1
                    enemy.maxHealth += 2; // 1点基础 + 1点额外
                    enemy.currentHealth = enemy.maxHealth; // 升级时恢复满血
                } else {
                    enemy[randomAttr] += 1;
                }
            }
            
            // 重新计算最终移动速度
            enemy.finalMoveSpeed = 20 + (enemy.moveSpeed * 0.5);
        }
        
        const bossText = enemy.isBoss ? ' (BOSS)' : '';
        const pointsText = enemy.isBoss ? '5点属性点' : '10点属性点';
        console.log(`${enemy.name}${bossText} 升级到 ${enemy.level} 级 (每级${pointsText})，属性: 攻击${enemy.attackPower} 防御${enemy.defense} 速度${enemy.moveSpeed} 生命${enemy.maxHealth}`);
    }
    
    // 随机生成敌人
    spawnRandomEnemy() {
        // 从当前关卡的敌人类型中随机选择
        const enemyTypes = this.getCurrentLevelEnemyTypes();
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemyData = EnemyPresets.getPreset(randomType);
        const enemy = new Enemy(enemyData);
        
        // 计算敌人等级：1 + 编队角色等级15% + 本关击杀5%
        let levelBonus = 0;
        this.battleTeam.forEach(character => {
            if (character && character.type === 'Player') {
                levelBonus += character.level * 0.15;
            }
        });
        levelBonus += this.killCount * 0.05;
        
        const newLevel = Math.max(1, Math.floor(1 + levelBonus));
        const levelUps = newLevel - enemy.level;
        
        if (levelUps > 0) {
            this.levelUpEnemy(enemy, levelUps);
        }
        
        // 森林关卡特殊加成：+50%最大生命值，+20%攻击力和防御力
        if (this.currentLevel && this.currentLevel.id === 'forest') {
            // 增加50%最大生命值
            enemy.maxHealth = Math.floor(enemy.maxHealth * 1.5);
            // 回复满生命值
            enemy.health = enemy.maxHealth;
            // 增加20%攻击力
            enemy.attack = Math.floor(enemy.attack * 1.2);
            // 增加20%防御力
            enemy.defense = Math.floor(enemy.defense * 1.2);
            
            console.log(`森林关卡加成: ${enemy.name} 生命:${enemy.health}/${enemy.maxHealth} 攻击:${enemy.attack} 防御:${enemy.defense}`);
        }
        
        // 计算敌人圆形大小（基于体积属性）
        enemy.radius = (enemy.volume / 100) * 25; // 基础半径25像素
        
        // 寻找安全的生成位置（远离玩家角色）
        const safePosition = this.findSafeEnemySpawnPosition(enemy);
        enemy.x = safePosition.x;
        enemy.y = safePosition.y;
        
        // 设置随机移动方向
        const angle = Math.random() * 2 * Math.PI;
        enemy.directionX = Math.cos(angle);
        enemy.directionY = Math.sin(angle);
        
        // 计算最终移动速度：20 + 敌人移动速度 * 50%
        enemy.finalMoveSpeed = 20 + (enemy.moveSpeed * 0.5);
        
        // 添加到敌人列表
        this.enemies.push(enemy);
        
        console.log(`生成敌人: ${enemy.name} 等级:${enemy.level} 位置:(${Math.round(enemy.x)}, ${Math.round(enemy.y)}) 速度:${enemy.finalMoveSpeed}`);
        
        // 重绘画面
        this.drawLevel();
    }
    
    // 随机生成资源点
    spawnRandomResourcePoint() {
        // 检查当前关卡是否支持资源点
        if (!this.currentLevel || !this.maxResourcePoints[this.currentLevel.id]) {
            return;
        }
        
        // 检查是否达到数量上限
        if (this.resourcePoints.length >= this.maxResourcePoints[this.currentLevel.id]) {
            return;
        }
        
        // 生成资源点
        const resourcePoint = ResourcePointPresets.generateRandomResourcePoint(this.currentLevel.id);
        
        // 寻找安全的生成位置（远离玩家角色）
        const safePosition = this.findSafeResourceSpawnPosition(resourcePoint);
        resourcePoint.x = safePosition.x;
        resourcePoint.y = safePosition.y;
        
        // 添加到资源点列表
        this.resourcePoints.push(resourcePoint);
        
        console.log(`生成资源点: ${resourcePoint.name} 位置:(${Math.round(resourcePoint.x)}, ${Math.round(resourcePoint.y)})`);
        
        // 重绘画面
        this.drawLevel();
    }
    
    // 寻找安全的资源点生成位置
    findSafeResourceSpawnPosition(resourcePoint) {
        const margin = resourcePoint.radius + 10;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = margin + Math.random() * (this.canvas.width - 2 * margin);
            const y = margin + Math.random() * (this.canvas.height - 2 * margin);
            
            let isSafe = true;
            
            // 检查与玩家角色的距离
            for (const character of this.battleTeam) {
                if (character && character.x !== undefined && character.y !== undefined) {
                    const distance = Math.sqrt(
                        Math.pow(x - character.x, 2) + Math.pow(y - character.y, 2)
                    );
                    
                    if (distance < resourcePoint.radius + character.radius + 50) {
                        isSafe = false;
                        break;
                    }
                }
            }
            
            // 检查与其他资源点的距离
            if (isSafe) {
                for (const otherResource of this.resourcePoints) {
                    const distance = Math.sqrt(
                        Math.pow(x - otherResource.x, 2) + Math.pow(y - otherResource.y, 2)
                    );
                    
                    if (distance < resourcePoint.radius + otherResource.radius + 30) {
                        isSafe = false;
                        break;
                    }
                }
            }
            
            if (isSafe) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // 如果找不到安全位置，返回边缘位置
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: // 上边
                return { x: Math.random() * this.canvas.width, y: margin };
            case 1: // 右边
                return { x: this.canvas.width - margin, y: Math.random() * this.canvas.height };
            case 2: // 下边
                return { x: Math.random() * this.canvas.width, y: this.canvas.height - margin };
            case 3: // 左边
                return { x: margin, y: Math.random() * this.canvas.height };
        }
    }
    
    // 更新资源点系统
    updateResourcePoints() {
        // 更新所有资源点的无敌状态
        this.resourcePoints.forEach(resourcePoint => {
            resourcePoint.updateInvincibility();
        });
        
        // 检查是否需要生成新的资源点
        const currentTime = Date.now();
        if (currentTime - this.lastResourceSpawnTime >= this.resourceSpawnInterval) {
            // 随机化生成间隔（5-10秒）
            this.resourceSpawnInterval = (5 + Math.random() * 5) * 1000;
            this.lastResourceSpawnTime = currentTime;
            
            // 尝试生成资源点
            this.spawnRandomResourcePoint();
        }
    }
    
    // 绘制资源点
    drawResourcePoint(resourcePoint) {
        if (!this.ctx) return;
        
        this.ctx.save();
        
        // 如果资源点处于无敌状态，添加闪烁效果
        if (resourcePoint.isCurrentlyInvincible()) {
            const flashIntensity = Math.sin(Date.now() * 0.02) * 0.5 + 0.5; // 0-1之间的闪烁值
            this.ctx.globalAlpha = 0.5 + flashIntensity * 0.5; // 透明度在0.5-1之间变化
            
            // 添加无敌光环效果
            this.ctx.beginPath();
            this.ctx.arc(resourcePoint.x, resourcePoint.y, resourcePoint.radius + 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#FFD700'; // 金色光环
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // 绘制资源点图标
        this.ctx.font = `${resourcePoint.radius * 1.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(resourcePoint.icon, resourcePoint.x, resourcePoint.y);
        
        // 在图标上方显示资源点名称
        const nameY = resourcePoint.y - resourcePoint.radius - 8;
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.strokeText(resourcePoint.name, resourcePoint.x, nameY);
        this.ctx.fillText(resourcePoint.name, resourcePoint.x, nameY);
        
        // 如果处于无敌状态，在名称旁显示盾牌图标
        if (resourcePoint.isCurrentlyInvincible()) {
            this.ctx.font = '12px Arial';
            this.ctx.fillText('🛡️', resourcePoint.x + 35, nameY);
        }
        
        // 绘制生命值条
        const barWidth = resourcePoint.radius * 2;
        const barHeight = 4;
        const barX = resourcePoint.x - barWidth / 2;
        const barY = resourcePoint.y + resourcePoint.radius - 3;
        
        // 背景条
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 生命值条（资源点使用蓝色血条）
        const healthPercent = resourcePoint.currentHealth / resourcePoint.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#2196F3' : healthPercent > 0.25 ? '#03A9F4' : '#0277BD';
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        this.ctx.restore();
    }
    
    // 处理资源点死亡
    handleResourcePointDeath(resourcePoint, attacker) {
        console.log(`资源点 ${resourcePoint.name} 被摧毁`);
        
        // 触发击杀资源点的被动技能效果
        if (attacker) {
            this.triggerResourceKillPassiveSkills(attacker);
        }
        
        // 获取掉落物
        const drops = resourcePoint.getDrops();
        
        // 将掉落物添加到背包并显示获得效果
        drops.forEach(itemId => {
            const itemData = ItemPresets.getPreset(itemId);
            const item = new Item(itemData);
            this.inventory.push(item);
            
            // 添加到本关掉落物追踪
            this.levelDrops.push({
                item: item,
                timestamp: Date.now(),
                source: 'resource_point'
            });
            
            console.log(`获得物品: ${item.name}`);
            
            // 显示掉落物获得效果（在攻击者头顶）
            if (attacker) {
                this.showItemDropEffect(
                    attacker.x, 
                    attacker.y - attacker.radius - 30, 
                    item.icon, 
                    1, // 数量为1
                    item.name // 添加物品名称
                );
            }
            
            // 在关卡区域左下角显示掉落物通知
            this.showLevelDropNotification(item);
        });
        
        // 从资源点列表中移除
        const index = this.resourcePoints.indexOf(resourcePoint);
        if (index > -1) {
            this.resourcePoints.splice(index, 1);
        }
        
        // 显示获得物品的提示
        if (drops.length > 0) {
            const itemNames = drops.map(itemId => ItemPresets.getPreset(itemId).name).join(', ');
            console.log(`从 ${resourcePoint.name} 获得: ${itemNames}`);
        }
    }
    
    // 触发边界碰撞被动技能效果
    triggerBoundaryPassiveSkills(character) {
        // 检查角色装备的被动技能
        character.skills.forEach(skill => {
            if (skill && skill.type === 'passive' && skill.effects) {
                const effects = skill.effects;
                
                // 转身技巧：触碰边界时恢复生命值
                if (effects.boundaryHeal) {
                    const healAmount = effects.boundaryHeal;
                    const actualHeal = Math.min(healAmount, character.maxHealth - character.currentHealth);
                    
                    if (actualHeal > 0) {
                        character.currentHealth += actualHeal;
                        console.log(`${character.getDisplayName()} 的转身技巧触发，恢复了${actualHeal}点生命值`);
                        
                        // 显示治疗效果
                        if (this.showHealingNumbers) {
                            this.showFloatingText(character.x, character.y - 20, `+${actualHeal} HP`, '#4CAF50');
                        }
                    }
                }
            }
        });
    }
    
    // 触发击杀资源点被动技能效果
    triggerResourceKillPassiveSkills(character) {
        // 检查角色装备的被动技能
        character.skills.forEach(skill => {
            if (skill && skill.type === 'passive' && skill.effects) {
                const effects = skill.effects;
                
                // 淘金者：击杀资源点时获得金币
                if (effects.resourceGoldReward) {
                    const { min, max } = effects.resourceGoldReward;
                    const goldAmount = Math.floor(Math.random() * (max - min + 1)) + min;
                    
                    this.gold += goldAmount;
                    console.log(`${character.getDisplayName()} 的淘金者触发，获得了${goldAmount}金币`);
                    
                    // 显示金币获得效果
                    this.showFloatingText(character.x, character.y - 40, `+${goldAmount} 金币`, '#FFD700');
                }
            }
        });
    }
    
    // 触发敌人接触被动技能效果
    triggerEnemyTouchPassiveSkills(character) {
        // 检查角色装备的被动技能
        character.skills.forEach(skill => {
            if (skill && skill.type === 'passive' && skill.effects) {
                const effects = skill.effects;
                
                // 毛手毛脚：触碰敌人时获得金币
                if (effects.enemyTouchGoldReward) {
                    const { min, max } = effects.enemyTouchGoldReward;
                    const goldAmount = Math.floor(Math.random() * (max - min + 1)) + min;
                    
                    this.gold += goldAmount;
                    console.log(`${character.getDisplayName()} 的毛手毛脚触发，获得了${goldAmount}金币`);
                    
                    // 显示金币获得效果
                    this.showFloatingText(character.x, character.y - 60, `+${goldAmount} 金币`, '#FFA500');
                }
            }
        });
    }
    
    // 绘制敌人
    drawEnemy(enemy) {
        if (!this.ctx) return;
        
        this.ctx.save();
        
        // 不再绘制敌人圆形容器（隐藏）
        // this.ctx.beginPath();
        // this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, 2 * Math.PI);
        // this.ctx.fillStyle = enemy.getThreatColor();
        // this.ctx.fill();
        // this.ctx.strokeStyle = '#333';
        // this.ctx.lineWidth = 2;
        // this.ctx.stroke();
        
        // 绘制敌人图标
        this.ctx.font = `${enemy.radius * 1.2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(enemy.icon, enemy.x, enemy.y);
        
        // BOSS特殊效果
        if (enemy.isBoss) {
            // 绘制BOSS光环效果
            this.ctx.save();
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.radius + 10, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.restore();
            
            // 绘制BOSS标识
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('👑', enemy.x, enemy.y - enemy.radius - 25);
            this.ctx.fillText('👑', enemy.x, enemy.y - enemy.radius - 25);
        }
        
        // 在头像上方显示敌人等级（再向下移动一点）
        const levelY = enemy.y - enemy.radius - 4;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1; // 减少描边宽度
        this.ctx.lineJoin = 'round'; // 设置线条连接为圆角
        this.ctx.lineCap = 'round'; // 设置线条端点为圆角
        this.ctx.strokeText(`Lv.${enemy.level}`, enemy.x, levelY);
        this.ctx.fillText(`Lv.${enemy.level}`, enemy.x, levelY);
        
        // 绘制生命值条（向上移动5像素）
        const barWidth = enemy.radius * 2;
        const barHeight = 4;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y + enemy.radius - 3; // 血条再向上移动一点
        
        // 背景条
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 生命值条
        const healthPercent = enemy.currentHealth / enemy.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#F44336' : healthPercent > 0.25 ? '#FF5722' : '#D32F2F';
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // 绘制激怒状态指示器
        this.drawEnrageIndicator(enemy);
        
        // 绘制虚弱诅咒符号
        this.drawCurseSymbol(enemy);
        
        // 绘制燃烧状态符号
        this.drawBurningIndicator(enemy);
        
        this.ctx.restore();
    }
    
    // 绘制玩家角色
    drawPlayerCharacter(character) {
        if (!this.ctx) return;
        
        this.ctx.save();
        
        // 获取被动技能加成，包括体积倍率
        let sizeMultiplier = 1;
        if (character.skills && typeof character.getPassiveSkillBonuses === 'function') {
            try {
                const passiveBonuses = character.getPassiveSkillBonuses();
                if (passiveBonuses.multipliers && passiveBonuses.multipliers.sizeMultiplier) {
                    sizeMultiplier = passiveBonuses.multipliers.sizeMultiplier;
                }
            } catch (error) {
                console.warn('获取体积倍率时出错:', error);
            }
        }
        
        // 应用体积倍率到半径
        const effectiveRadius = character.radius * sizeMultiplier;
        
        // 绘制角色图标
        this.ctx.font = `${effectiveRadius * 1.2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(character.avatar, character.x, character.y);
        
        // 在头像头顶显示角色名（向下移动10像素）
        const nameY = character.y - effectiveRadius - 8;
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1; // 减少描边宽度，避免尖刺效果
        this.ctx.lineJoin = 'round'; // 设置线条连接为圆角
        this.ctx.lineCap = 'round'; // 设置线条端点为圆角
        this.ctx.strokeText(character.getDisplayName(), character.x, nameY);
        this.ctx.fillText(character.getDisplayName(), character.x, nameY);
        
        // 绘制生命值条
        const barWidth = effectiveRadius * 2;
        const barHeight = 4;
        const barX = character.x - barWidth / 2;
        const barY = character.y + effectiveRadius - 3;
        
        // 背景条
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 生命值条
        const healthPercent = character.currentHealth / character.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // 绘制魔法值条（紧贴血条下方，高度为血条的一半）
        const manaBarHeight = barHeight / 2;
        const manaBarY = barY + barHeight;
        
        // 魔法值背景条
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(barX, manaBarY, barWidth, manaBarHeight);
        
        // 魔法值条（蓝色）
        const manaPercent = character.currentMana / character.maxMana;
        this.ctx.fillStyle = '#2196F3'; // 蓝色
        this.ctx.fillRect(barX, manaBarY, barWidth * manaPercent, manaBarHeight);
        
        // 绘制经验值条（紧贴魔法值条下方，高度为血条的一半）
        const expBarHeight = barHeight / 2;
        const expBarY = manaBarY + manaBarHeight;
        
        // 经验值背景条
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(barX, expBarY, barWidth, expBarHeight);
        
        // 经验值条（橙色）
        const expPercent = character.currentExp / character.maxExp;
        this.ctx.fillStyle = '#FF9800'; // 橙色
        this.ctx.fillRect(barX, expBarY, barWidth * expPercent, expBarHeight);
        
        // 在血条位置显示角色等级（更高的图层层级，不会被血条遮挡）
        const levelY = barY + barHeight / 2; // 血条中央位置
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFF00'; // 黄色表示玩家角色等级
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1; // 减少描边宽度
        this.ctx.lineJoin = 'round'; // 设置线条连接为圆角
        this.ctx.lineCap = 'round'; // 设置线条端点为圆角
        this.ctx.strokeText(`Lv.${character.level}`, character.x, levelY);
        this.ctx.fillText(`Lv.${character.level}`, character.x, levelY);
        
        // 绘制激怒状态指示器
        this.drawEnrageIndicator(character);
        
        this.ctx.restore();
    }
    
    // 绘制激怒状态指示器
    drawEnrageIndicator(unit) {
        if (!this.ctx || !unit.hasStatusEffect || !unit.hasStatusEffect('enrage')) return;
        
        this.ctx.save();
        
        // 计算抖动偏移（基于时间的轻微抖动）
        const time = Date.now();
        const shakeIntensity = 2; // 抖动强度
        const shakeSpeed = 0.01; // 抖动速度
        const offsetX = Math.sin(time * shakeSpeed) * shakeIntensity;
        const offsetY = Math.cos(time * shakeSpeed * 1.3) * shakeIntensity;
        
        // 激怒符号位置（在头像上方）
        const indicatorX = unit.x + offsetX;
        const indicatorY = unit.y - unit.radius - 25 + offsetY;
        
        // 绘制激怒符号
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FF0000'; // 红色
        this.ctx.fillText('😡', indicatorX, indicatorY);
        
        this.ctx.restore();
    }
    
    // 绘制虚弱诅咒符号
    drawCurseSymbol(enemy) {
        if (!this.ctx || !enemy.curseSymbol) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - enemy.curseSymbol.startTime;
        
        // 检查是否过期
        if (elapsed >= enemy.curseSymbol.duration) {
            delete enemy.curseSymbol;
            return;
        }
        
        this.ctx.save();
        
        // 计算透明度（最后1秒淡出）
        const fadeStartTime = enemy.curseSymbol.duration - 1000;
        let alpha = 1;
        if (elapsed > fadeStartTime) {
            alpha = 1 - (elapsed - fadeStartTime) / 1000;
        }
        
        // 计算浮动效果
        const floatOffset = Math.sin(elapsed * 0.003) * 3;
        
        // 诅咒符号位置（在敌人右上方）
        const symbolX = enemy.x + enemy.radius * 0.7;
        const symbolY = enemy.y - enemy.radius * 0.7 + floatOffset;
        
        // 绘制诅咒符号
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#8B008B'; // 深紫色
        this.ctx.fillText(enemy.curseSymbol.icon, symbolX, symbolY);
        
        this.ctx.restore();
    }
    
    // 绘制燃烧状态符号
    drawBurningIndicator(enemy) {
        if (!this.ctx || !enemy.statusEffects) return;
        
        // 查找燃烧状态效果
        const burningEffect = enemy.statusEffects.find(effect => effect.id === 'burning');
        if (!burningEffect) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - burningEffect.startTime;
        
        // 检查是否过期
        if (elapsed >= burningEffect.duration) {
            return;
        }
        
        this.ctx.save();
        
        // 计算透明度（最后1秒淡出）
        const fadeStartTime = burningEffect.duration - 1000;
        let alpha = 1;
        if (elapsed > fadeStartTime) {
            alpha = 1 - (elapsed - fadeStartTime) / 1000;
        }
        
        // 计算抖动效果（使用更快的频率和更大的幅度）
        const shakeX = (Math.random() - 0.5) * 4; // 水平抖动 ±2像素
        const shakeY = (Math.random() - 0.5) * 4; // 垂直抖动 ±2像素
        
        // 燃烧符号位置（在敌人头顶正上方）
        const symbolX = enemy.x + shakeX;
        const symbolY = enemy.y - enemy.radius - 20 + shakeY;
        
        // 绘制燃烧符号
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.globalAlpha = alpha;
        
        // 添加发光效果
        this.ctx.shadowColor = '#FF6600';
        this.ctx.shadowBlur = 8;
        
        this.ctx.fillText('🔥', symbolX, symbolY);
        
        this.ctx.restore();
    }
    
    // 更新玩家角色位置
    updatePlayerCharacters() {
        this.battleTeam.forEach(character => {
            if (character && character.x !== undefined && character.y !== undefined && !character.isDead) {
                // 更新弹开动画
                this.updateKnockbackAnimation(character);
                
                // 如果不在弹开状态，进行正常移动
                if (!character.isKnockingBack) {
                    // 检查是否有冲锋状态
                    const chargeEffect = character.getStatusEffect('charge');
                    if (chargeEffect) {
                        // 冲锋状态：朝目标敌人移动
                        const target = chargeEffect.effects.chargeTarget;
                        if (target && target.currentHealth > 0) {
                            const dx = target.x - character.x;
                            const dy = target.y - character.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance > 0) {
                                character.directionX = dx / distance;
                                character.directionY = dy / distance;
                                character.finalMoveSpeed = chargeEffect.effects.chargeSpeed;
                            }
                        } else {
                            // 目标已死亡，移除冲锋状态
                            character.removeStatusEffect('charge');
                        }
                    } else {
                        // 正常移动
                        character.finalMoveSpeed = 20 + (character.secondaryAttributes.moveSpeed * 0.5);
                    }
                    
                    // 计算每帧移动距离（假设60FPS）
                    const moveDistance = character.finalMoveSpeed / 60;
                    
                    // 更新位置
                    character.x += character.directionX * moveDistance;
                    character.y += character.directionY * moveDistance;
                    
                    // 边界检测
                    this.handleCharacterBoundaryCollision(character, moveDistance);
                    
                    // 随机改变方向（0.1%概率，但冲锋状态下不改变方向）
                    if (!character.hasStatusEffect('charge') && Math.random() < 0.001) {
                        const angle = Math.random() * 2 * Math.PI;
                        character.directionX = Math.cos(angle);
                        character.directionY = Math.sin(angle);
                    }
                }
                
                // 检测与敌人的碰撞（无论是否在弹开状态都要检测）
                this.checkCharacterEnemyCollisions(character);
                
                // 检测与资源点的碰撞
                this.checkCharacterResourceCollisions(character);
                
                // 魔法值恢复（每帧恢复 魔法恢复速度/60，保留小数进行计算）
                const manaRegenPerFrame = character.secondaryAttributes.manaRegen / 60;
                const oldMana = character.currentMana;
                character.currentMana = Math.min(
                    character.currentMana + manaRegenPerFrame,
                    character.maxMana
                );
                
                // 生命值恢复（每帧恢复 生命恢复速度/60，保留小数进行计算）
                const healthRegenPerFrame = character.secondaryAttributes.healthRegen / 60;
                const oldHealth = character.currentHealth;
                character.currentHealth = Math.min(
                    character.currentHealth + healthRegenPerFrame,
                    character.maxHealth
                );
                
                // 显示治疗数字（当实际恢复了生命值时）
                const actualHealing = character.currentHealth - oldHealth;
                if (actualHealing > 0 && this.showHealthRegenNumbers) { // 使用专门的生命恢复数字显示标志
                    // 累积治疗量，每秒显示一次治疗数字
                    if (!character.accumulatedHealing) character.accumulatedHealing = 0;
                    if (!character.lastHealingDisplayTime) character.lastHealingDisplayTime = 0;
                    
                    character.accumulatedHealing += actualHealing;
                    
                    const currentTime = Date.now();
                    if (currentTime - character.lastHealingDisplayTime >= 1000) { // 每秒显示一次
                        if (character.accumulatedHealing >= 0.1) { // 只有当累积治疗量大于0.1时才显示
                            this.showHealingNumber(
                                character.x, 
                                character.y - character.radius - 15, 
                                character.accumulatedHealing
                            );
                        }
                        character.accumulatedHealing = 0;
                        character.lastHealingDisplayTime = currentTime;
                    }
                }
                
                // 检查是否可以自动释放主动技能
                if (character.canAutoUseActiveSkills && character.canAutoUseActiveSkills()) {
                    character.autoUseActiveSkills(this.enemies);
                }
                
                // 更新状态效果
                character.updateStatusEffects();
                
                // 调试：每秒输出一次恢复值变化
                if (!character.lastRegenLogTime) character.lastRegenLogTime = 0;
                const currentTime = Date.now();
                if (currentTime - character.lastRegenLogTime >= 1000) {
                    console.log(`${character.getDisplayName()} 恢复: HP ${oldHealth.toFixed(1)} -> ${character.currentHealth.toFixed(1)} (${character.secondaryAttributes.healthRegen.toFixed(1)}/秒), MP ${oldMana.toFixed(1)} -> ${character.currentMana.toFixed(1)} (${character.secondaryAttributes.manaRegen.toFixed(1)}/秒)`);
                    character.lastRegenLogTime = currentTime;
                }
            }
        });
    }
    
    // 处理角色边界碰撞
    handleCharacterBoundaryCollision(character, moveDistance) {
        let hitBoundary = false;
        
        if (character.x - character.radius <= 0 || character.x + character.radius >= this.canvas.width) {
            character.x = Math.max(character.radius, Math.min(this.canvas.width - character.radius, character.x));
            hitBoundary = true;
        }
        
        if (character.y - character.radius <= 0 || character.y + character.radius >= this.canvas.height) {
            character.y = Math.max(character.radius, Math.min(this.canvas.height - character.radius, character.y));
            hitBoundary = true;
        }
        
        // 如果触碰到边界，触发被动技能效果
        if (hitBoundary) {
            this.triggerBoundaryPassiveSkills(character);
        }
        
        // 如果触碰到边界，重新选择随机方向
        if (hitBoundary) {
            let newAngle;
            let attempts = 0;
            do {
                newAngle = Math.random() * 2 * Math.PI;
                const testDirectionX = Math.cos(newAngle);
                const testDirectionY = Math.sin(newAngle);
                
                // 检查新方向是否会让角色远离边界
                const futureX = character.x + testDirectionX * moveDistance * 5;
                const futureY = character.y + testDirectionY * moveDistance * 5;
                
                if (futureX >= character.radius && futureX <= this.canvas.width - character.radius &&
                    futureY >= character.radius && futureY <= this.canvas.height - character.radius) {
                    character.directionX = testDirectionX;
                    character.directionY = testDirectionY;
                    break;
                }
                attempts++;
            } while (attempts < 10);
            
            // 如果找不到合适方向，朝向画布中心
            if (attempts >= 10) {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const toCenterX = centerX - character.x;
                const toCenterY = centerY - character.y;
                const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
                
                if (distance > 0) {
                    character.directionX = toCenterX / distance;
                    character.directionY = toCenterY / distance;
                }
            }
        }
    }
    
    // 检测角色与敌人的碰撞
    checkCharacterEnemyCollisions(character) {
        this.enemies.forEach(enemy => {
            const distance = Math.sqrt(
                Math.pow(character.x - enemy.x, 2) + 
                Math.pow(character.y - enemy.y, 2)
            );
            
            // 检测碰撞（体积接触）
            if (distance <= character.radius + enemy.radius) {
                this.handleCharacterEnemyCollision(character, enemy);
            }
        });
    }
    
    // 检测角色与资源点的碰撞
    checkCharacterResourceCollisions(character) {
        this.resourcePoints.forEach(resourcePoint => {
            const distance = Math.sqrt(
                Math.pow(character.x - resourcePoint.x, 2) + 
                Math.pow(character.y - resourcePoint.y, 2)
            );
            
            // 检测碰撞（体积接触）
            if (distance <= character.radius + resourcePoint.radius) {
                this.handleCharacterResourceCollision(character, resourcePoint);
            }
        });
    }
    
    // 处理角色与资源点的碰撞
    handleCharacterResourceCollision(character, resourcePoint) {
        // 计算弹开方向（从资源点指向角色）
        const dx = character.x - resourcePoint.x;
        const dy = character.y - resourcePoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 避免除零错误
        if (distance > 0) {
            // 标准化方向向量
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            // 弹开距离（确保角色不再与资源点重叠）
            const knockbackDistance = character.radius + resourcePoint.radius + 5;
            const currentDistance = distance;
            const pushDistance = knockbackDistance - currentDistance;
            
            if (pushDistance > 0) {
                // 将角色推开到安全距离
                character.x += normalizedDx * pushDistance;
                character.y += normalizedDy * pushDistance;
                
                // 确保角色不会被推出画布边界
                character.x = Math.max(character.radius, Math.min(this.canvas.width - character.radius, character.x));
                character.y = Math.max(character.radius, Math.min(this.canvas.height - character.radius, character.y));
            }
        }
        
        // 检查资源点是否处于无敌状态
        if (resourcePoint.isCurrentlyInvincible()) {
            console.log(`${resourcePoint.name} 处于无敌状态，免疫 ${character.getDisplayName()} 的碰撞伤害`);
            return; // 无敌状态下不受伤害
        }
        
        // 资源点受到伤害（使用calculateDamage方法以支持被动技能）
        const baseDamage = character.secondaryAttributes.attackPower;
        const damage = this.calculateDamage(baseDamage, 0, character, resourcePoint);
        const actualDamage = resourcePoint.takeDamage(damage);
        
        // 设置0.5秒无敌状态
        resourcePoint.setInvincible(500);
        
        // 显示伤害数字
        this.showDamageNumber(resourcePoint.x, resourcePoint.y - resourcePoint.radius - 10, actualDamage, 'player');
        
        console.log(`${character.getDisplayName()} 攻击 ${resourcePoint.name}，造成 ${actualDamage} 伤害，获得0.5秒无敌`);
        
        // 检查资源点是否被摧毁
        if (resourcePoint.currentHealth <= 0) {
            this.handleResourcePointDeath(resourcePoint, character);
        }
    }
    
    // 处理战斗
    processCombat(character, enemy) {
        // 角色攻击敌人（检查敌人是否无敌）
        if (!enemy.isCurrentlyInvincible || !enemy.isCurrentlyInvincible()) {
            const characterDamage = this.calculateDamage(character.secondaryAttributes.attackPower, enemy.defense, character, enemy);
            enemy.currentHealth -= characterDamage;
            // 显示伤害数字
            this.showDamageNumber(enemy.x, enemy.y - enemy.radius - 10, characterDamage, 'player'); // 玩家造成的伤害（橙色）
            console.log(`${character.getDisplayName()} 对 ${enemy.name} 造成 ${characterDamage} 伤害`);
        } else {
            console.log(`${enemy.name} 处于无敌状态，免疫 ${character.getDisplayName()} 的攻击`);
        }
        
        // 敌人攻击角色（检查角色是否无敌）
        if (!character.isCurrentlyInvincible || !character.isCurrentlyInvincible()) {
            const enemyDamage = this.calculateDamage(enemy.attackPower, character.secondaryAttributes.defense, enemy, character);
            character.currentHealth -= enemyDamage;
            // 显示伤害数字
            this.showDamageNumber(character.x, character.y - character.radius - 10, enemyDamage, 'enemy'); // 敌人造成的伤害（红色）
            console.log(`${enemy.name} 对 ${character.getDisplayName()} 造成 ${enemyDamage} 伤害`);
        } else {
            console.log(`${character.getDisplayName()} 处于无敌状态，免疫 ${enemy.name} 的攻击`);
        }
        
        // 检查死亡 - 修复BOSS碰撞消失问题
        let enemyDied = false;
        let characterDied = false;
        
        // 先检查敌人死亡
        if (enemy.currentHealth <= 0) {
            // 对于BOSS，需要特殊处理 - 不能立即判定死亡
            if (enemy.isBoss) {
                // BOSS生命值≤0时，先进行保护性检查
                console.warn(`⚠️ BOSS ${enemy.name} 生命值异常 (${enemy.currentHealth})，进行保护性处理`);
                
                // 检查是否真的应该死亡（简化死亡条件）
                const shouldReallyDie = enemy.currentHealth <= 0; // BOSS生命值≤0时就应该死亡
                
                if (shouldReallyDie) {
                    enemyDied = true;
                    console.log(`🔥 BOSS ${enemy.name} 确认死亡，开始处理BOSS死亡`);
                    this.handleEnemyDeath(enemy, character);
                } else {
                    // 保护BOSS，恢复少量生命值
                    enemy.currentHealth = Math.max(1, Math.min(10, enemy.maxHealth * 0.1));
                    console.log(`🛡️ BOSS ${enemy.name} 受到保护，生命值恢复到 ${enemy.currentHealth}`);
                }
            } else {
                // 普通敌人正常死亡处理
                enemyDied = true;
                this.handleEnemyDeath(enemy, character);
            }
        }
        
        // 再检查角色死亡
        if (character.currentHealth <= 0) {
            characterDied = true;
            console.log(`💀 角色 ${character.getDisplayName()} 生命值归零，开始处理角色死亡`);
            this.handleCharacterDeath(character);
        }
        
        // 增强BOSS保护：确保BOSS状态完整性
        if (enemy.isBoss && !enemyDied) {
            // 额外保护：确保BOSS在敌人列表中
            if (!this.enemies.includes(enemy)) {
                console.error(`🚨 检测到BOSS ${enemy.name} 不在敌人列表中，重新添加！`);
                this.enemies.push(enemy);
            }
            
            // 确保BOSS标记完整
            if (!enemy.isBoss) {
                console.error(`🚨 检测到BOSS ${enemy.name} 失去BOSS标记，恢复标记！`);
                enemy.isBoss = true;
            }
        }
        
        // 触发敌人接触被动技能效果
        this.triggerEnemyTouchPassiveSkills(character);
        
        return { enemyDied, characterDied };
    }
    
    // 计算伤害（支持被动技能增强）
    calculateDamage(attackPower, defense, attacker = null, target = null) {
        // 基础伤害计算：防御力每点减少1点伤害，最小伤害为1
        let finalDamage = Math.max(1, attackPower - defense);
        
        // 如果有攻击者，检查被动技能增强
        if (attacker && attacker.skills) {
            attacker.skills.forEach(skill => {
                if (skill && skill.type === 'passive' && skill.effects) {
                    const effects = skill.effects;
                    
                    // 巨人杀手：对敌人造成额外百分比伤害
                    if (effects.percentageDamage && target && target.currentHealth) {
                        const percentageDamage = Math.floor(target.currentHealth * effects.percentageDamage);
                        finalDamage += percentageDamage;
                        console.log(`${attacker.getDisplayName()} 的巨人杀手触发，额外造成${percentageDamage}点伤害`);
                    }
                    
                    // 自然学：对资源点造成的伤害增加100%
                    if (effects.resourceDamageMultiplier && target && target.type === 'ResourcePoint') {
                        finalDamage = Math.floor(finalDamage * effects.resourceDamageMultiplier);
                        console.log(`${attacker.getDisplayName()} 的自然学触发，对资源点伤害增加到${finalDamage}`);
                    }
                }
            });
        }
        
        return Math.floor(finalDamage);
    }
    
    // 处理敌人死亡
    handleEnemyDeath(enemy, killer) {
        // 创建死亡粒子特效（烟花爆炸效果）
        this.createDeathParticles(enemy.x, enemy.y);
        
        // 移除敌人
        const enemyIndex = this.enemies.indexOf(enemy);
        if (enemyIndex > -1) {
            this.enemies.splice(enemyIndex, 1);
        }
        
        // 通知新BOSS系统
        if (this.bossManager) {
            this.bossManager.onEnemyKilled(enemy);
        }
        
        // 增加击杀计数（BOSS存在时不增加）
        if (!this.bossManager || !this.bossManager.bossActive) {
            this.killCount++;
        }
        
        // 更新任务进度
        this.updateQuestProgress('kill', { enemyType: enemy.name });
        
        // 计算经验值
        let baseExp = 10 + (enemy.level * 0.5);
        
        // BOSS提供8倍经验值
        if (enemy.isBoss) {
            baseExp *= 8;
            console.log(`🔥 BOSS被击杀！获得8倍经验值奖励`);
        }
        
        const killerExp = baseExp * (killer.secondaryAttributes.expGain / 100);
        const teammateExp = killerExp * 0.5;
        
        // 给击杀者经验值
        this.giveExperience(killer, killerExp);
        
        // 给队友经验值
        this.battleTeam.forEach(character => {
            if (character && character !== killer && character.type === 'Player' && !character.isDead) {
                this.giveExperience(character, teammateExp);
            }
        });
        
        // BOSS死亡时给予金币奖励
        if (enemy.isBoss) {
            const goldReward = 200 + (enemy.level * 2);
            this.gold += goldReward;
            this.updateGoldDisplay();
            console.log(`🔥 BOSS死亡奖励: ${goldReward} 金币！当前金币: ${this.gold}`);
            
            // 通知BOSS管理器处理BOSS死亡
            this.bossManager.onEnemyKilled(enemy);
        } else {
            // 普通敌人死亡，通知BOSS管理器
            this.bossManager.onEnemyKilled(enemy);
            
            // 普通敌人掉落系统
            this.handleNormalEnemyDrops(enemy);
        }
        
        console.log(`${enemy.name} 被 ${killer.getDisplayName()} 击杀！击杀计数: ${this.killCount}`);
    }
    
    // 创建死亡粒子特效（烟花爆炸效果）
    createDeathParticles(x, y) {
        const particleCount = 20; // 粒子数量
        const colors = ['#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFCCCC']; // 红色系
        
        for (let i = 0; i < particleCount; i++) {
            // 随机角度和速度，形成爆炸效果
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 3; // 速度2-5
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4, // 大小3-7
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.0,
                lifetime: 1000, // 持续1秒
                createdAt: Date.now()
            };
            
            this.particles.push(particle);
        }
    }
    
    // 更新粒子系统
    updateParticles() {
        const currentTime = Date.now();
        
        // 更新每个粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const age = currentTime - particle.createdAt;
            
            // 移除过期粒子
            if (age >= particle.lifetime) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 应用重力
            particle.vy += 0.15;
            
            // 应用空气阻力
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // 更新透明度（淡出效果）
            particle.alpha = 1.0 - (age / particle.lifetime);
        }
    }
    
    // 绘制粒子系统
    drawParticles() {
        if (!this.ctx || !this.particles) return;
        
        this.ctx.save();
        
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    // 处理普通敌人掉落
    handleNormalEnemyDrops(enemy) {
        const drops = [];
        
        // 0.5% 概率掉落技能书
        if (Math.random() < 0.005) {
            const skillBookIds = [
                'savage_charge_book', 'heavy_punch_book', 'emergency_bandage_book', 'enrage_book',
                'weakness_curse_book', 'mana_restore_book', 'rush_book', 'shield_bash_book',
                'fire_ball_book', 'ice_shard_book', 'lightning_bolt_book', 'heal_book',
                'poison_dart_book', 'wind_slash_book'
            ];
            const randomSkillBook = skillBookIds[Math.floor(Math.random() * skillBookIds.length)];
            const skillBook = new Item(ItemPresets.getPreset(randomSkillBook));
            this.inventory.push(skillBook);
            drops.push(`📚 ${skillBook.name}`);
            
            // 添加到本关掉落物追踪
            this.levelDrops.push({
                item: skillBook,
                timestamp: Date.now(),
                source: '普通敌人'
            });
            
            // 在关卡区域左下角显示掉落物通知
            this.showLevelDropNotification(skillBook);
            
            console.log(`🎁 普通敌人掉落: ${skillBook.name}`);
        }
        
        // 2% 概率掉落种子（包含所有7种种子）
        if (Math.random() < 0.02) {
            const seedIds = [
                'carrot_seed',    // 胡萝卜种子
                'potato_seed',    // 土豆种子
                'fish_seed',      // 鱼苗
                'mushroom_seed',  // 蘑菇孢子
                'tomato_seed',    // 番茄种子
                'banana_seed',    // 香蕉种子
                'tea_seed'        // 茶叶种子
            ];
            const randomSeedId = seedIds[Math.floor(Math.random() * seedIds.length)];
            const seedPreset = ItemPresets.getPreset(randomSeedId);
            const seed = new Item(seedPreset);
            // 为种子添加预设ID
            seed.presetId = randomSeedId;
            this.inventory.push(seed);
            drops.push(`🌱 ${seed.name}`);
            
            // 添加到本关掉落物追踪
            this.levelDrops.push({
                item: seed,
                timestamp: Date.now(),
                source: '普通敌人'
            });
            
            // 在关卡区域左下角显示掉落物通知
            this.showLevelDropNotification(seed);
            
            console.log(`🎁 普通敌人掉落: ${seed.name}`);
        }
        
        // 如果有掉落物，显示通知
        if (drops.length > 0) {
            this.showEnemyDropNotification(drops);
        }
    }
    
    // 显示普通敌人掉落通知
    showEnemyDropNotification(drops) {
        const notification = document.createElement('div');
        notification.className = 'enemy-drop-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="margin-bottom: 4px;">🎁 敌人掉落</div>
            <div>${drops.join('<br>')}</div>
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动消失
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    

    

    

    
    // 显示掉落物品通知
    showDropNotification(food, egg, skillBook = null) {
        // 创建掉落通知UI
        const notification = document.createElement('div');
        notification.className = 'drop-notification';
        
        let itemsHtml = `
            <div class="drop-item">
                <span class="drop-icon">${food.icon}</span>
                <span class="drop-name">${food.name}</span>
            </div>
            <div class="drop-item">
                <span class="drop-icon">${egg.icon}</span>
                <span class="drop-name">${egg.name}</span>
            </div>
        `;
        
        if (skillBook) {
            itemsHtml += `
                <div class="drop-item">
                    <span class="drop-icon">${skillBook.icon}</span>
                    <span class="drop-name">${skillBook.name}</span>
                </div>
            `;
        }
        
        notification.innerHTML = `
            <div class="drop-title">🎁 BOSS掉落奖励</div>
            <div class="drop-items">
                ${itemsHtml}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除通知
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // 获取当前关卡的敌人类型
    getCurrentLevelEnemyTypes() {
        // 根据当前关卡返回可用的敌人类型
        if (this.currentLevel && this.currentLevel.id === 7) { // 草原关卡
            return ['snake', 'wolf', 'boar', 'fox'];
        } else if (this.currentLevel && this.currentLevel.id === 8) { // 森林关卡
            return ['monkey', 'gorilla', 'skeleton', 'ghost', 'tiger'];
        } else {
            return ['wolf', 'boar', 'snake']; // 默认
        }
    }
    
    // 获取当前关卡的BOSS敌人类型
    getCurrentLevelBossTypes() {
        // 根据当前关卡返回可用的BOSS类型
        if (this.currentLevel && this.currentLevel.id === 7) { // 草原关卡
            return ['bear']; // 只有巨熊
        } else if (this.currentLevel && this.currentLevel.id === 8) { // 森林关卡
            return ['troll']; // 只有巨魔
        } else {
            return ['bear']; // 默认巨熊
        }
    }
    
    // 计算BOSS等级
    calculateBossLevel() {
        let bossLevel = 5; // 基础等级5
        
        // 加上每个编队槽位中当前玩家角色等级的25%
        this.battleTeam.forEach(character => {
            if (character && character.type === 'Player') {
                bossLevel += Math.floor(character.level * 0.25);
            }
        });
        
        // 加上本关击杀数量的10%
        bossLevel += Math.floor(this.killCount * 0.1);
        
        return Math.max(1, bossLevel);
    }
    
    // 寻找安全的BOSS生成位置
    findSafeBossSpawnPosition(boss) {
        const maxAttempts = 50;
        const margin = 50; // 边界边距
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = margin + Math.random() * (this.canvas.width - 2 * margin);
            const y = margin + Math.random() * (this.canvas.height - 2 * margin);
            
            let validPosition = true;
            
            // 检查是否与玩家角色碰撞
            this.battleTeam.forEach(character => {
                if (character && character.x !== undefined && character.y !== undefined) {
                    const distance = Math.sqrt(Math.pow(x - character.x, 2) + Math.pow(y - character.y, 2));
                    if (distance < boss.radius + character.radius + 20) { // 额外20像素安全距离
                        validPosition = false;
                    }
                }
            });
            
            // 检查是否与其他敌人碰撞
            this.enemies.forEach(enemy => {
                if (enemy !== boss) {
                    const distance = Math.sqrt(Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2));
                    if (distance < boss.radius + enemy.radius + 10) {
                        validPosition = false;
                    }
                }
            });
            
            // 检查是否与资源点碰撞
            this.resourcePoints.forEach(resourcePoint => {
                const distance = Math.sqrt(Math.pow(x - resourcePoint.x, 2) + Math.pow(y - resourcePoint.y, 2));
                if (distance < boss.radius + resourcePoint.radius + 10) {
                    validPosition = false;
                }
            });
            
            if (validPosition) {
                return { x, y };
            }
        }
        
        return null; // 无法找到安全位置
    }
    
    // 处理角色死亡
    handleCharacterDeath(character) {
        // 设置死亡状态
        character.isDead = true;
        character.deathTime = Date.now();
        character.reviveCountdown = 60; // 60秒复活倒计时
        
        // ✅ 重要：保存角色引用，防止闭包中的变量被污染
        const deadCharacter = character;
        const characterName = character.getDisplayName();
        
        // 检查是否有敌人正在与该角色进行弹开动画
        const enemiesInKnockback = this.enemies.filter(enemy => enemy.isKnockingBack);
        if (enemiesInKnockback.length > 0) {
            console.log(`⚠️ 检测到${enemiesInKnockback.length}个敌人正在弹开，延迟清除角色位置信息`);
            
            // 延迟清除位置信息，等待弹开动画完成
            setTimeout(() => {
                // ✅ 安全检查：确保清除的是角色而不是敌人
                if (deadCharacter && deadCharacter.isDead && !deadCharacter.isBoss) {
                    // 从关卡区域移除角色（清除位置信息），但保留在编队槽位中
                    deadCharacter.x = undefined;
                    deadCharacter.y = undefined;
                    deadCharacter.directionX = 0;
                    deadCharacter.directionY = 0;
                    console.log(`${characterName} 位置信息已延迟清除（弹开动画完成后）`);
                } else {
                    console.warn(`⚠️ 延迟清除位置时检测到异常，跳过清除操作`);
                }
            }, 600); // 等待600ms，确保弹开动画完成（弹开持续500ms）
        } else {
            // 没有弹开动画，立即清除位置信息
            // ✅ 安全检查：确保清除的是角色而不是敌人
            if (character && !character.isBoss) {
                character.x = undefined;
                character.y = undefined;
                character.directionX = 0;
                character.directionY = 0;
            }
        }
        
        console.log(`${characterName} 死亡！将在60秒后自动复活`);
    }
    
    // 给予经验值
    giveExperience(character, exp) {
        // 应用被动技能的经验倍率
        let finalExp = exp;
        if (character.skills && typeof character.getPassiveSkillBonuses === 'function') {
            try {
                const passiveBonuses = character.getPassiveSkillBonuses();
                if (passiveBonuses.multipliers && passiveBonuses.multipliers.expGainMultiplier) {
                    finalExp = Math.floor(exp * passiveBonuses.multipliers.expGainMultiplier);
                    if (passiveBonuses.multipliers.expGainMultiplier > 1) {
                        console.log(`${character.getDisplayName()} 的求知欲触发，经验值从${exp}增加到${finalExp}`);
                    }
                }
            } catch (error) {
                console.warn('应用经验倍率时出错:', error);
            }
        }
        
        character.currentExp += finalExp;
        
        // 添加安全检查，防止无限循环
        let levelUpCount = 0;
        const maxLevelUps = 10; // 一次最多升级10级
        
        // 检查升级
        while (character.currentExp >= character.maxExp && levelUpCount < maxLevelUps) {
            // 检查是否已达到等级上限
            if (character.level >= character.maxLevel) {
                console.log(`${character.getDisplayName()} 已达到等级上限 ${character.maxLevel}，停止升级`);
                character.currentExp = character.maxExp - 1; // 设置为接近满经验但不超过
                break;
            }
            
            character.currentExp -= character.maxExp;
            this.levelUpCharacter(character);
            levelUpCount++;
        }
        
        // 如果达到最大升级次数限制，记录警告
        if (levelUpCount >= maxLevelUps) {
            console.warn(`${character.getDisplayName()} 一次性升级次数达到限制 ${maxLevelUps}，停止升级以防止无限循环`);
        }
    }
    
    // 角色升级
    levelUpCharacter(character) {
        // 检查是否已达到等级上限
        if (character.level >= character.maxLevel) {
            console.log(`${character.getDisplayName()} 已达到等级上限 ${character.maxLevel}，无法继续升级`);
            return false;
        }
        
        character.level++;
        
        // 每级获得3点属性点，随机分配到4个主属性
        const attributePoints = 3;
        const attributes = ['strength', 'agility', 'intelligence', 'skill'];
        
        for (let i = 0; i < attributePoints; i++) {
            const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
            character.attributes[randomAttr]++;
        }
        
        // 重新计算副属性和生命值
        character.updateAttributes();
        
        // 升级时恢复满生命值
        character.currentHealth = character.maxHealth;
        
        // 更新等级相关任务进度
        this.updateQuestProgress('level', { level: character.level });
        
        console.log(`${character.getDisplayName()} 升级到 ${character.level} 级！属性: 力量${character.attributes.strength} 敏捷${character.attributes.agility} 智慧${character.attributes.intelligence} 技巧${character.attributes.skill}，生命值已恢复满值`);
        
        // 如果在战斗关卡，刷新战斗面板以更新等级显示
        if (this.currentLevel && (this.currentLevel.id === 7 || this.currentLevel.id === 8)) {
            this.initBattlePanel();
        }
        
        return true;
    }
    
    // 处理角色与敌人的碰撞
    handleCharacterEnemyCollision(character, enemy) {
        // 防止高频率重复碰撞
        const currentTime = Date.now();
        const collisionKey = `${character.id || character.getDisplayName()}_${enemy.id || enemy.name}`;
        
        if (!this.lastCollisionTimes) {
            this.lastCollisionTimes = new Map();
        }
        
        const lastCollisionTime = this.lastCollisionTimes.get(collisionKey) || 0;
        const collisionCooldown = 100; // 100ms冷却时间
        
        if (currentTime - lastCollisionTime < collisionCooldown) {
            // 在冷却时间内，跳过处理
            return;
        }
        
        this.lastCollisionTimes.set(collisionKey, currentTime);
        
        // 检查是否有冲锋状态，如果有则立即移除
        if (character.hasStatusEffect('charge')) {
            character.removeStatusEffect('charge');
            console.log(`${character.getDisplayName()} 的冲锋状态因碰撞而结束`);
        }
        
        const characterWeight = character.secondaryAttributes.weight;
        const enemyWeight = enemy.weight;
        
        console.log(`碰撞检测: ${character.getDisplayName()}(体重:${characterWeight}) vs ${enemy.name}(体重:${enemyWeight})`);
        
        // 战斗系统：互相造成伤害
        this.processCombat(character, enemy);
        
        // 计算双方的弹开距离，基于体重差异
        const weightDifference = Math.abs(characterWeight - enemyWeight);
        const baseKnockbackDistance = Math.max(10, weightDifference * 0.5); // 最小弹开距离10像素
        
        // 角色的弹开距离：体重越小相对于敌人，弹开距离越大
        let characterKnockbackDistance;
        if (characterWeight < enemyWeight) {
            // 角色体重小，弹开距离 = 基础距离 + 额外距离
            const extraDistance = (enemyWeight - characterWeight) * 0.8;
            characterKnockbackDistance = baseKnockbackDistance + extraDistance;
        } else if (characterWeight > enemyWeight) {
            // 角色体重大，弹开距离 = 基础距离 - 减少距离
            const reducedDistance = (characterWeight - enemyWeight) * 0.3;
            characterKnockbackDistance = Math.max(5, baseKnockbackDistance - reducedDistance);
        } else {
            // 体重相同，使用基础距离
            characterKnockbackDistance = baseKnockbackDistance;
        }
        
        // 敌人的弹开距离：体重越小相对于角色，弹开距离越大
        let enemyKnockbackDistance;
        if (enemyWeight < characterWeight) {
            // 敌人体重小，弹开距离 = 基础距离 + 额外距离
            const extraDistance = (characterWeight - enemyWeight) * 0.8;
            enemyKnockbackDistance = baseKnockbackDistance + extraDistance;
        } else if (enemyWeight > characterWeight) {
            // 敌人体重大，弹开距离 = 基础距离 - 减少距离
            const reducedDistance = (enemyWeight - characterWeight) * 0.3;
            enemyKnockbackDistance = Math.max(5, baseKnockbackDistance - reducedDistance);
        } else {
            // 体重相同，使用基础距离
            enemyKnockbackDistance = baseKnockbackDistance;
        }
        
        // 双方都会被弹开，但距离不同，弹开速度为各自移动速度的50%
        this.startKnockbackAnimation(character, enemy, characterKnockbackDistance, character.finalMoveSpeed * 0.5);
        this.startKnockbackAnimation(enemy, character, enemyKnockbackDistance, enemy.finalMoveSpeed * 0.5);
        
        console.log(`弹开距离 - ${character.getDisplayName()}: ${characterKnockbackDistance.toFixed(1)}px, ${enemy.name}: ${enemyKnockbackDistance.toFixed(1)}px`);
    }
    
    // 开始平滑弹开动画
    startKnockbackAnimation(unit, otherUnit, distance, speed) {
        // 如果单位已经在弹开中，不重复处理
        if (unit.isKnockingBack) {
            return;
        }
        
        // ✅ 安全检查：确保单位有有效的坐标
        if (unit.x === undefined || unit.y === undefined || isNaN(unit.x) || isNaN(unit.y)) {
            console.warn(`⚠️ ${unit.name || 'Unknown'} 坐标无效 (x:${unit.x}, y:${unit.y})，跳过弹开动画`);
            return;
        }
        
        if (otherUnit.x === undefined || otherUnit.y === undefined || isNaN(otherUnit.x) || isNaN(otherUnit.y)) {
            console.warn(`⚠️ ${otherUnit.name || 'Unknown'} 坐标无效 (x:${otherUnit.x}, y:${otherUnit.y})，跳过弹开动画`);
            return;
        }
        
        // 计算弹开方向
        const dx = unit.x - otherUnit.x;
        const dy = unit.y - otherUnit.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return; // 避免除零错误
        
        const normalizedX = dx / length;
        const normalizedY = dy / length;
        
        // 保存原始状态
        const originalSpeed = unit.finalMoveSpeed;
        const originalDirectionX = unit.directionX;
        const originalDirectionY = unit.directionY;
        
        // 设置弹开状态
        unit.isKnockingBack = true;
        unit.knockbackStartTime = Date.now();
        unit.knockbackDuration = 500; // 弹开持续500毫秒
        unit.knockbackDistance = distance;
        unit.knockbackSpeed = speed;
        unit.knockbackStartX = unit.x;
        unit.knockbackStartY = unit.y;
        
        // 设置0.5秒无敌效果
        if (unit.setInvincible) {
            unit.setInvincible(500); // 0.5秒无敌
        }
        
        // 计算目标位置
        const targetX = unit.x + normalizedX * distance;
        const targetY = unit.y + normalizedY * distance;
        
        // 确保目标位置在边界内
        const radius = unit.radius || 25;
        unit.knockbackTargetX = Math.max(radius, Math.min(this.canvas.width - radius, targetX));
        unit.knockbackTargetY = Math.max(radius, Math.min(this.canvas.height - radius, targetY));
        
        // 设置弹开方向
        unit.directionX = normalizedX;
        unit.directionY = normalizedY;
        unit.finalMoveSpeed = speed;
        
        // 保存原始状态以便恢复
        unit.originalSpeed = originalSpeed;
        unit.originalDirectionX = originalDirectionX;
        unit.originalDirectionY = originalDirectionY;
    }
    
    // 更新弹开动画
    updateKnockbackAnimation(unit) {
        if (!unit.isKnockingBack) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - unit.knockbackStartTime;
        const progress = Math.min(elapsed / unit.knockbackDuration, 1);
        
        // 使用缓动函数创建平滑效果（先快后慢）
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        // 计算当前位置
        unit.x = unit.knockbackStartX + (unit.knockbackTargetX - unit.knockbackStartX) * easeOut;
        unit.y = unit.knockbackStartY + (unit.knockbackTargetY - unit.knockbackStartY) * easeOut;
        
        // 弹开完成
        if (progress >= 1) {
            unit.x = unit.knockbackTargetX;
            unit.y = unit.knockbackTargetY;
            
            // ✅ 安全检查：如果坐标变成NaN，恢复到起始位置
            if (isNaN(unit.x) || isNaN(unit.y)) {
                console.error(`❌ ${unit.name || 'Unknown'} 弹开后坐标变成NaN，恢复到起始位置`);
                unit.x = unit.knockbackStartX || (this.canvas ? this.canvas.width / 2 : 400);
                unit.y = unit.knockbackStartY || (this.canvas ? this.canvas.height / 2 : 300);
            }
            
            unit.isKnockingBack = false;
            
            // 恢复原始状态
            if (unit.originalSpeed !== undefined) {
                unit.finalMoveSpeed = unit.originalSpeed;
                delete unit.originalSpeed;
            }
            
            // 只为存活的单位选择新的移动方向
            // 已死亡的角色不应该移动
            const isDeadCharacter = unit.isDead === true;
            if (!isDeadCharacter) {
                // ✅ 修复：优先恢复原始方向，如果原始方向不存在或单位是BOSS，则选择指向画面中心的方向
                if (unit.originalDirectionX !== undefined && unit.originalDirectionY !== undefined && !unit.isBoss) {
                    // 恢复原始移动方向（非BOSS单位）
                    unit.directionX = unit.originalDirectionX;
                    unit.directionY = unit.originalDirectionY;
                } else {
                    // BOSS或没有原始方向的单位：选择指向画面中心的方向，避免移出画面
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const toCenterX = centerX - unit.x;
                    const toCenterY = centerY - unit.y;
                    const toCenterLength = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
                    
                    if (toCenterLength > 0) {
                        // 指向画面中心
                        unit.directionX = toCenterX / toCenterLength;
                        unit.directionY = toCenterY / toCenterLength;
                        console.log(`${unit.name || unit.getDisplayName()} 弹开完成，设置方向指向画面中心`);
                    } else {
                        // 已经在中心，随机选择方向
                        const angle = Math.random() * 2 * Math.PI;
                        unit.directionX = Math.cos(angle);
                        unit.directionY = Math.sin(angle);
                    }
                }
            } else {
                // 已死亡的角色，停止移动
                unit.directionX = 0;
                unit.directionY = 0;
            }
            
            // 清理弹开相关属性
            delete unit.knockbackStartTime;
            delete unit.knockbackDuration;
            delete unit.knockbackStartX;
            delete unit.knockbackStartY;
            delete unit.knockbackTargetX;
            delete unit.knockbackTargetY;
            delete unit.originalDirectionX;
            delete unit.originalDirectionY;
            
            console.log(`${unit.name || unit.getDisplayName()} 弹开动画完成，恢复正常移动`);
        }
    }
    // 更新敌人位置
    updateEnemies() {
        // 过滤掉已死亡的敌人，但保护BOSS不被意外移除
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.currentHealth > 0) {
                return true; // 存活的敌人保留
            }
            
            // 对于生命值≤0的敌人，检查是否为BOSS
            if (enemy.isBoss) {
                // BOSS生命值≤0时，不应该在这里被移除
                // BOSS的死亡应该只通过processCombat中的handleEnemyDeath处理
                console.warn(`⚠️ updateEnemies检测到BOSS ${enemy.name} 生命值异常 (${enemy.currentHealth})，强制保护`);
                
                // 强制恢复BOSS生命值，防止被意外移除
                enemy.currentHealth = Math.max(1, enemy.currentHealth);
                
                return true; // 强制保护BOSS不被移除
            }
            
            // 普通敌人生命值≤0时正常移除
            return false;
        });
        
        // 额外的BOSS完整性检查 - 使用新BOSS系统的状态
        const bossCount = this.enemies.filter(e => e.isBoss).length;
        if (this.bossManager && this.bossManager.bossActive && this.bossManager.currentBoss && bossCount === 0) {
            console.error(`🚨 检测到BOSS状态异常：bossActive=${this.bossManager.bossActive}, currentBoss存在=${!!this.bossManager.currentBoss}, 但敌人列表中无BOSS`);
            
            // 如果currentBoss还存在但不在敌人列表中，重新添加
            if (this.bossManager.currentBoss && !this.enemies.includes(this.bossManager.currentBoss)) {
                console.error(`🚨 重新添加丢失的BOSS: ${this.bossManager.currentBoss.name}`);
                this.bossManager.currentBoss.currentHealth = Math.max(1, this.bossManager.currentBoss.currentHealth);
                this.enemies.push(this.bossManager.currentBoss);
            }
        }
        
        this.enemies.forEach(enemy => {
            // 更新敌人的状态效果（如燃烧）
            if (enemy.updateStatusEffects) {
                enemy.updateStatusEffects(this);
            }
            
            // 更新弹开动画
            this.updateKnockbackAnimation(enemy);
            
            // 如果不在弹开状态，进行正常移动
            if (!enemy.isKnockingBack) {
                // 计算每帧移动距离（假设60FPS）
                const moveDistance = enemy.finalMoveSpeed / 60;
                
                // 更新位置
                enemy.x += enemy.directionX * moveDistance;
                enemy.y += enemy.directionY * moveDistance;
                
                // 边界检测和反弹 - 触碰边缘时重新选择随机方向
                let hitBoundary = false;
                
                if (enemy.x - enemy.radius <= 0 || enemy.x + enemy.radius >= this.canvas.width) {
                    enemy.x = Math.max(enemy.radius, Math.min(this.canvas.width - enemy.radius, enemy.x));
                    hitBoundary = true;
                }
                
                if (enemy.y - enemy.radius <= 0 || enemy.y + enemy.radius >= this.canvas.height) {
                    enemy.y = Math.max(enemy.radius, Math.min(this.canvas.height - enemy.radius, enemy.y));
                    hitBoundary = true;
                }
                
                // 如果触碰到边界，重新选择随机方向（确保新方向指向画布内部）
                if (hitBoundary) {
                    let newAngle;
                    let attempts = 0;
                    do {
                        newAngle = Math.random() * 2 * Math.PI;
                        const testDirectionX = Math.cos(newAngle);
                        const testDirectionY = Math.sin(newAngle);
                        
                        // 检查新方向是否会让敌人远离边界
                        const futureX = enemy.x + testDirectionX * moveDistance * 5; // 预测5帧后的位置
                        const futureY = enemy.y + testDirectionY * moveDistance * 5;
                        
                        if (futureX >= enemy.radius && futureX <= this.canvas.width - enemy.radius &&
                            futureY >= enemy.radius && futureY <= this.canvas.height - enemy.radius) {
                            enemy.directionX = testDirectionX;
                            enemy.directionY = testDirectionY;
                            break;
                        }
                        attempts++;
                    } while (attempts < 10); // 最多尝试10次
                    
                    // 如果10次都没找到合适方向，就选择朝向画布中心的方向
                    if (attempts >= 10) {
                        const centerX = this.canvas.width / 2;
                        const centerY = this.canvas.height / 2;
                        const toCenterX = centerX - enemy.x;
                        const toCenterY = centerY - enemy.y;
                        const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
                        
                        if (distance > 0) {
                            enemy.directionX = toCenterX / distance;
                            enemy.directionY = toCenterY / distance;
                        }
                    }
                    
                    console.log(`${enemy.name} 触碰边界，重新选择方向: (${enemy.directionX.toFixed(2)}, ${enemy.directionY.toFixed(2)})`);
                }
                
                // 随机改变方向（降低概率到0.1%，大约每16-17秒改变一次）
                if (Math.random() < 0.001) {
                    const angle = Math.random() * 2 * Math.PI;
                    enemy.directionX = Math.cos(angle);
                    enemy.directionY = Math.sin(angle);
                    console.log(`${enemy.name} 随机改变方向: (${enemy.directionX.toFixed(2)}, ${enemy.directionY.toFixed(2)})`);
                }
            }
        });
        
        // 更新新BOSS系统
        this.bossManager.update();
    }
    
    // BOSS状态一致性检查

    
    // 显示游戏消息
    showMessage(message, duration = 2000, color = '#FFFFFF') {
        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = 'game-message';
        messageDiv.innerHTML = message;
        
        // 设置样式
        messageDiv.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: ${color};
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            line-height: 1.4;
            animation: gameMessageFade ${duration}ms ease-out forwards;
        `;
        
        // 添加动画样式
        if (!document.getElementById('gameMessageAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'gameMessageAnimationStyle';
            style.textContent = `
                @keyframes gameMessageFade {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    10% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    90% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 添加到页面
        document.body.appendChild(messageDiv);
        
        // 自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, duration);
    }
    
    // 更新复活倒计时
    updateReviveCountdowns() {
        const currentTime = Date.now();
        
        this.characters.forEach(character => {
            if (character.isDead && character.reviveCountdown > 0) {
                // 计算剩余倒计时时间
                const elapsedSeconds = Math.floor((currentTime - character.deathTime) / 1000);
                const remainingTime = Math.max(0, 60 - elapsedSeconds);
                character.reviveCountdown = remainingTime;
                
                // 检查是否应该复活
                if (remainingTime <= 0) {
                    this.reviveCharacter(character);
                }
            }
        });
    }
    
    // 复活角色
    reviveCharacter(character) {
        character.isDead = false;
        character.currentHealth = character.maxHealth; // 复活时恢复满生命值
        character.currentMana = Math.floor(character.maxMana * 0.3); // 复活时恢复30%魔法值
        character.reviveCountdown = 0;
        delete character.deathTime;
        
        // 如果角色在编队中，重新在关卡区域生成
        const isInBattleTeam = this.battleTeam.includes(character);
        if (isInBattleTeam && this.currentLevel) {
            // 所有关卡都重新生成角色位置
            this.spawnCharacterInLevel(character);
            console.log(`${character.getDisplayName()} 已复活并重新在关卡中生成！位置: (${Math.round(character.x)}, ${Math.round(character.y)})`);
        } else {
            console.log(`${character.getDisplayName()} 已复活！生命值: ${character.currentHealth}/${character.maxHealth}`);
        }
    }
    
    // 显示伤害数字
    showDamageNumber(x, y, damage, type) {
        const damageNumber = {
            x: x,
            y: y,
            startY: y,
            damage: damage,
            type: type, // 'player' 或 'enemy'
            startTime: Date.now(),
            duration: 2000, // 2秒持续时间
            opacity: 1.0
        };
        
        this.damageNumbers.push(damageNumber);
    }
    
    // 显示治疗数字
    showHealingNumber(x, y, healing) {
        const healingNumber = {
            x: x,
            y: y,
            startY: y,
            damage: healing, // 复用damage字段存储治疗量
            type: 'healing', // 新的治疗类型
            startTime: Date.now(),
            duration: 2000, // 2秒持续时间
            opacity: 1.0
        };
        
        this.damageNumbers.push(healingNumber);
    }
    
    // 显示治疗效果（图标+数字）
    showHealingEffect(x, y, healing, icon, sourceType = 'skill') {
        const healingEffect = {
            x: x,
            y: y,
            startY: y,
            healing: healing,
            icon: icon,
            sourceType: sourceType, // 'skill' 或 'consumable'
            startTime: Date.now(),
            duration: 2000, // 2秒持续时间
            opacity: 1.0
        };
        
        this.healingEffects.push(healingEffect);
    }
    
    // 显示魔法恢复效果（图标+数字）
    showManaRestoreEffect(x, y, manaRestore, icon) {
        const manaEffect = {
            x: x,
            y: y,
            startY: y,
            manaRestore: manaRestore,
            icon: icon,
            sourceType: 'mana', // 魔法恢复类型
            startTime: Date.now(),
            duration: 2000, // 2秒持续时间
            opacity: 1.0
        };
        
        this.manaRestoreEffects.push(manaEffect);
    }
    
    // 显示浮动文本（通用方法）
    showFloatingText(x, y, text, color) {
        const floatingText = {
            x: x,
            y: y,
            startY: y,
            text: text,
            color: color,
            startTime: Date.now(),
            duration: 2000, // 2秒持续时间
            opacity: 1.0
        };
        
        // 复用damageNumbers数组来显示浮动文本
        this.damageNumbers.push({
            x: x,
            y: y,
            startY: y,
            damage: text, // 复用damage字段存储文本
            type: 'floating', // 新的浮动文本类型
            color: color, // 添加颜色字段
            startTime: Date.now(),
            duration: 2000,
            opacity: 1.0
        });
    }
    
    // 显示技能名浮动文本
    showSkillNameText(x, y, skillName) {
        const skillText = {
            x: x,
            y: y,
            startY: y,
            damage: skillName, // 复用damage字段存储技能名
            type: 'skill', // 技能名类型
            startTime: Date.now(),
            duration: 4000, // 4秒持续时间
            opacity: 1.0
        };
        
        this.damageNumbers.push(skillText);
    }
    
    // 显示魔法恢复数字（简化版本）
    showManaRestoreNumber(x, y, manaAmount) {
        const manaNumber = {
            x: x,
            y: y,
            startY: y,
            damage: `+${manaAmount} MP`, // 复用damage字段存储魔法恢复文本
            type: 'mana', // 魔法恢复类型
            startTime: Date.now(),
            duration: 2000, // 2秒持续时间
            opacity: 1.0
        };
        
        this.damageNumbers.push(manaNumber);
    }
    
    // 显示掉落物获得效果
    showItemDropEffect(x, y, itemIcon, quantity, itemName) {
        const dropEffect = {
            x: x,
            y: y,
            startY: y,
            itemIcon: itemIcon,
            quantity: quantity,
            itemName: itemName || '', // 添加物品名称
            startTime: Date.now(),
            duration: 2000, // 2秒持续时间
            opacity: 1.0
        };
        
        this.itemDropEffects.push(dropEffect);
    }
    
    // 更新伤害数字动画
    updateDamageNumbers() {
        const currentTime = Date.now();
        
        // 更新每个伤害数字的位置和透明度
        this.damageNumbers.forEach(damageNumber => {
            const elapsed = currentTime - damageNumber.startTime;
            const progress = elapsed / damageNumber.duration;
            
            if (progress <= 1) {
                // 向上漂浮：2秒内向上移动60像素
                damageNumber.y = damageNumber.startY - (progress * 60);
                
                // 淡出效果：从1.0到0.0
                damageNumber.opacity = 1.0 - progress;
            }
        });
        
        // 移除已过期的伤害数字
        this.damageNumbers = this.damageNumbers.filter(damageNumber => {
            const elapsed = currentTime - damageNumber.startTime;
            return elapsed < damageNumber.duration;
        });
    }
    
    // 更新治疗效果动画
    updateHealingEffects() {
        const currentTime = Date.now();
        
        // 更新每个治疗效果的位置和透明度
        this.healingEffects.forEach(healingEffect => {
            const elapsed = currentTime - healingEffect.startTime;
            const progress = elapsed / healingEffect.duration;
            
            if (progress <= 1) {
                // 向上漂浮：2秒内向上移动60像素
                healingEffect.y = healingEffect.startY - (progress * 60);
                
                // 淡出效果：从1.0到0.0
                healingEffect.opacity = 1.0 - progress;
            }
        });
        
        // 移除已过期的治疗效果
        this.healingEffects = this.healingEffects.filter(healingEffect => {
            const elapsed = currentTime - healingEffect.startTime;
            return elapsed < healingEffect.duration;
        });
    }
    
    // 更新魔法恢复效果动画
    updateManaRestoreEffects() {
        const currentTime = Date.now();
        
        // 更新每个魔法恢复效果的位置和透明度
        this.manaRestoreEffects.forEach(manaEffect => {
            const elapsed = currentTime - manaEffect.startTime;
            const progress = elapsed / manaEffect.duration;
            
            if (progress <= 1) {
                // 向上漂浮：2秒内向上移动60像素
                manaEffect.y = manaEffect.startY - (progress * 60);
                
                // 淡出效果：从1.0到0.0
                manaEffect.opacity = 1.0 - progress;
            }
        });
        
        // 移除已过期的魔法恢复效果
        this.manaRestoreEffects = this.manaRestoreEffects.filter(manaEffect => {
            const elapsed = currentTime - manaEffect.startTime;
            return elapsed < manaEffect.duration;
        });
    }
    
    // 更新掉落物效果动画
    updateItemDropEffects() {
        const currentTime = Date.now();
        
        // 更新每个掉落物效果的位置和透明度
        this.itemDropEffects.forEach(dropEffect => {
            const elapsed = currentTime - dropEffect.startTime;
            const progress = elapsed / dropEffect.duration;
            
            if (progress <= 1) {
                // 向上漂浮：2秒内向上移动80像素
                dropEffect.y = dropEffect.startY - (progress * 80);
                
                // 淡出效果：从1.0到0.0
                dropEffect.opacity = 1.0 - progress;
            }
        });
        
        // 移除已过期的掉落物效果
        this.itemDropEffects = this.itemDropEffects.filter(dropEffect => {
            const elapsed = currentTime - dropEffect.startTime;
            return elapsed < dropEffect.duration;
        });
    }
    
    // 绘制伤害数字
    drawDamageNumbers() {
        if (!this.ctx) return;
        
        this.damageNumbers.forEach(damageNumber => {
            this.ctx.save();
            
            // 设置字体
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 设置透明度
            this.ctx.globalAlpha = damageNumber.opacity;
            
            // 根据类型设置颜色
            let fillColor, strokeColor;
            if (damageNumber.type === 'player') {
                fillColor = '#FF8C00'; // 橙色 - 玩家造成的伤害
            } else if (damageNumber.type === 'enemy') {
                fillColor = '#FF4444'; // 红色 - 敌人造成的伤害
            } else if (damageNumber.type === 'burning') {
                fillColor = '#FF6600'; // 橙红色 - 燃烧伤害
            } else if (damageNumber.type === 'healing') {
                fillColor = '#4CAF50'; // 绿色 - 治疗数字
            } else if (damageNumber.type === 'mana') {
                fillColor = '#9C27B0'; // 紫色 - 魔法恢复数字
            } else if (damageNumber.type === 'floating') {
                fillColor = damageNumber.color || '#FFFFFF'; // 浮动文本使用自定义颜色
            } else if (damageNumber.type === 'skill') {
                fillColor = '#FFD700'; // 金色 - 技能名文本
                // 技能名使用更大的字体
                this.ctx.font = 'bold 22px Arial';
            }
            strokeColor = '#000000'; // 黑色外描边
            
            // 绘制黑色外描边
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2; // 减少描边宽度
            this.ctx.lineJoin = 'round'; // 设置线条连接为圆角
            this.ctx.lineCap = 'round'; // 设置线条端点为圆角
            
            // 根据类型显示不同的符号
            let displayText;
            if (damageNumber.type === 'healing') {
                displayText = `+${damageNumber.damage.toFixed(0)}`; // 治疗显示+号
            } else if (damageNumber.type === 'mana') {
                displayText = damageNumber.damage; // 魔法恢复直接显示文本（已包含+号和MP）
            } else if (damageNumber.type === 'floating') {
                displayText = damageNumber.damage; // 浮动文本直接显示
            } else if (damageNumber.type === 'skill') {
                displayText = damageNumber.damage; // 技能名直接显示
            } else {
                displayText = `-${damageNumber.damage}`; // 伤害显示-号
            }
            
            this.ctx.strokeText(displayText, damageNumber.x, damageNumber.y);
            
            // 绘制数字
            this.ctx.fillStyle = fillColor;
            this.ctx.fillText(displayText, damageNumber.x, damageNumber.y);
            
            this.ctx.restore();
        });
    }
    
    // 绘制治疗效果（图标+数字）
    drawHealingEffects() {
        if (!this.ctx) return;
        
        this.healingEffects.forEach(healingEffect => {
            this.ctx.save();
            
            // 设置透明度
            this.ctx.globalAlpha = healingEffect.opacity;
            
            // 绘制图标
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(healingEffect.icon, healingEffect.x - 15, healingEffect.y);
            
            // 绘制治疗数字
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const displayText = `+${healingEffect.healing.toFixed(0)}`;
            
            // 绘制较细的黑色外描边
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1; // 较细的外描边
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';
            this.ctx.strokeText(displayText, healingEffect.x + 15, healingEffect.y);
            
            // 绘制绿色数字
            this.ctx.fillStyle = '#4CAF50'; // 绿色
            this.ctx.fillText(displayText, healingEffect.x + 15, healingEffect.y);
            
            this.ctx.restore();
        });
    }
    
    // 绘制魔法恢复效果（图标+数字）
    drawManaRestoreEffects() {
        if (!this.ctx) return;
        
        this.manaRestoreEffects.forEach(manaEffect => {
            this.ctx.save();
            
            // 设置透明度
            this.ctx.globalAlpha = manaEffect.opacity;
            
            // 绘制图标
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(manaEffect.icon, manaEffect.x - 15, manaEffect.y);
            
            // 绘制魔法恢复数字
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const displayText = `+${manaEffect.manaRestore.toFixed(0)}`;
            
            // 绘制较细的黑色外描边
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1; // 较细的外描边
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';
            this.ctx.strokeText(displayText, manaEffect.x + 15, manaEffect.y);
            
            // 绘制蓝色数字（魔法恢复用蓝色）
            this.ctx.fillStyle = '#2196F3'; // 蓝色
            this.ctx.fillText(displayText, manaEffect.x + 15, manaEffect.y);
            
            this.ctx.restore();
        });
    }
    
    // 绘制掉落物获得效果
    drawItemDropEffects() {
        if (!this.ctx) return;
        
        this.itemDropEffects.forEach(dropEffect => {
            this.ctx.save();
            
            // 设置透明度
            this.ctx.globalAlpha = dropEffect.opacity;
            
            // 绘制物品图标
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(dropEffect.itemIcon, dropEffect.x, dropEffect.y);
            
            // 绘制物品名称（在图标下方）
            if (dropEffect.itemName) {
                this.ctx.font = 'bold 12px Arial';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 2;
                this.ctx.lineJoin = 'round';
                this.ctx.lineCap = 'round';
                
                const nameY = dropEffect.y + 20; // 在图标下方20像素
                
                // 绘制黑色外描边
                this.ctx.strokeText(dropEffect.itemName, dropEffect.x, nameY);
                // 绘制白色文字
                this.ctx.fillText(dropEffect.itemName, dropEffect.x, nameY);
            }
            
            // 绘制数量（如果大于1）
            if (dropEffect.quantity > 1) {
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 2;
                this.ctx.lineJoin = 'round';
                this.ctx.lineCap = 'round';
                
                const quantityText = `×${dropEffect.quantity}`;
                const textX = dropEffect.x + 15;
                const textY = dropEffect.y + 8;
                
                // 绘制黑色外描边
                this.ctx.strokeText(quantityText, textX, textY);
                // 绘制白色文字
                this.ctx.fillText(quantityText, textX, textY);
            }
            
            this.ctx.restore();
        });
    }
    
    // 更新战斗面板中的状态条
    updateBattlePanelBars() {
        this.battleTeam.forEach((character, slotIndex) => {
            if (character) {
                // 更新生命值条
                const healthBar = document.querySelector(`[data-slot-index="${slotIndex}"] .health-bar .bar-fill`);
                const healthText = document.querySelector(`[data-slot-index="${slotIndex}"] .health-bar .bar-text`);
                if (healthBar && healthText) {
                    const healthPercent = (character.currentHealth / character.maxHealth) * 100;
                    healthBar.style.width = `${healthPercent}%`;
                    healthText.textContent = `HP: ${Math.floor(character.currentHealth)}/${Math.floor(character.maxHealth)}`;
                }
                
                // 更新魔法值条
                const manaBar = document.querySelector(`[data-slot-index="${slotIndex}"] .mana-bar .bar-fill`);
                const manaText = document.querySelector(`[data-slot-index="${slotIndex}"] .mana-bar .bar-text`);
                if (manaBar && manaText) {
                    const manaPercent = (character.currentMana / character.maxMana) * 100;
                    manaBar.style.width = `${manaPercent}%`;
                    manaText.textContent = `MP: ${Math.floor(character.currentMana)}/${Math.floor(character.maxMana)}`;
                }
                
                // 更新经验值条
                const expBar = document.querySelector(`[data-slot-index="${slotIndex}"] .exp-bar .bar-fill`);
                const expText = document.querySelector(`[data-slot-index="${slotIndex}"] .exp-bar .bar-text`);
                if (expBar && expText) {
                    const expPercent = (character.currentExp / character.maxExp) * 100;
                    expBar.style.width = `${expPercent}%`;
                    expText.textContent = `EXP: ${Math.floor(character.currentExp)}/${Math.floor(character.maxExp)}`;
                }
                
                // 更新等级显示
                const levelElement = document.querySelector(`[data-slot-index="${slotIndex}"] .slot-level`);
                if (levelElement) {
                    levelElement.textContent = `Lv.${character.level}`;
                }
                
                // 更新复活倒计时显示
                const reviveCountdown = document.querySelector(`[data-slot-index="${slotIndex}"] .slot-revive-countdown`);
                if (character.isDead && character.reviveCountdown > 0) {
                    if (reviveCountdown) {
                        reviveCountdown.textContent = `复活: ${Math.floor(character.reviveCountdown)}s`;
                    }
                } else if (reviveCountdown) {
                    reviveCountdown.style.display = 'none';
                }
                
                // 更新死亡状态样式
                const slot = document.querySelector(`[data-slot-index="${slotIndex}"]`);
                if (slot) {
                    const isDead = character.isDead || character.currentHealth <= 0;
                    if (isDead) {
                        slot.classList.remove('alive');
                        slot.classList.add('dead');
                    } else {
                        slot.classList.remove('dead');
                        slot.classList.add('alive');
                    }
                }
            }
        });
    }
    
    // 更新战斗面板（包括等级等静态信息）
    updateBattlePanel() {
        // 如果在战斗关卡，完全重新渲染战斗面板
        if (this.currentLevel && (this.currentLevel.id === 7 || this.currentLevel.id === 8)) {
            this.initBattlePanel();
        }
    }
    
    // 初始化战斗面板
    initBattlePanel() {
        const controlContent = document.querySelector('.control-content');
        if (!controlContent) {
            console.error('Control content not found');
            return;
        }
        
        this.createBattleUI(controlContent);
        console.log('Battle panel initialized');
    }
    
    // 创建战斗面板UI
    createBattleUI(container) {
        const consumableItems = this.inventory.filter(item => item.type === '消耗品');
        const levelDropItems = this.levelDrops.map(drop => drop.item);
        
        container.innerHTML = `
            <div class="battle-panel">
                <div class="battle-title">⚔️ 战斗面板</div>
                
                <div class="battle-team-section">
                    <div class="section-title">
                        编队槽位
                        <button class="auto-team-btn" onclick="game.autoFillTeam()">一键编队</button>
                    </div>
                    <div class="team-slots">
                        ${this.battleTeam.map((character, index) => this.createTeamSlotUI(character, index)).join('')}
                    </div>
                </div>
                
                <div class="battle-items-section">
                    <div class="section-title">物品仓库</div>
                    <div class="warehouse-tabs">
                        <button class="warehouse-tab ${this.battleItemTab === 'consumable' ? 'active' : ''}" data-tab="consumable">
                            消耗品 (${consumableItems.length})
                        </button>
                        <button class="warehouse-tab ${this.battleItemTab === 'drops' ? 'active' : ''}" data-tab="drops">
                            掉落物 (${levelDropItems.length})
                        </button>
                    </div>
                    ${this.createBattleItemTabContent()}
                </div>
            </div>
        `;
        
        // 绑定事件
        this.bindBattleEvents(container);
    }
    
    // 创建战斗面板物品标签页内容
    createBattleItemTabContent() {
        const itemsPerPage = 6;
        
        if (this.battleItemTab === 'consumable') {
            const consumableItems = this.inventory.filter(item => item.type === '消耗品');
            const totalPages = Math.max(1, Math.ceil(consumableItems.length / itemsPerPage));
            return this.createBattleItemsUI(consumableItems, itemsPerPage, totalPages, 'consumable');
        } else if (this.battleItemTab === 'drops') {
            const levelDropItems = this.levelDrops.map(drop => drop.item);
            const totalPages = Math.max(1, Math.ceil(levelDropItems.length / itemsPerPage));
            return this.createBattleItemsUI(levelDropItems, itemsPerPage, totalPages, 'drops');
        }
        
        return '';
    }
    
    // 获取掉落物品的来源
    getDropItemSource(itemName) {
        // 查找该物品在levelDrops中的来源
        const dropRecord = this.levelDrops.find(drop => drop.item.name === itemName);
        if (dropRecord) {
            switch (dropRecord.source) {
                case 'BOSS':
                    return 'BOSS';
                case '资源点':
                    return '资源点';
                case '普通敌人':
                    return '普通敌人';
                default:
                    return dropRecord.source || '未知';
            }
        }
        return '未知';
    }
    
    // 创建编队槽位UI
    createTeamSlotUI(character, slotIndex) {
        if (!character) {
            // 空槽位
            return `
                <div class="team-slot empty" data-slot-index="${slotIndex}">
                    <div class="slot-placeholder">
                        <div class="slot-icon">➕</div>
                        <div class="slot-text">点击添加角色</div>
                    </div>
                </div>
            `;
        } else {
            // 检查角色死亡状态
            const isDead = character.isDead || character.currentHealth <= 0;
            const slotClass = isDead ? 'filled dead' : 'filled alive';
            const reviveText = character.isDead && character.reviveCountdown > 0 ? 
                `<div class="slot-revive-countdown">复活: ${Math.floor(character.reviveCountdown)}s</div>` : '';
            
            // 有角色的槽位
            return `
                <div class="team-slot ${slotClass}" data-slot-index="${slotIndex}">
                    <div class="slot-character">
                        <div class="slot-avatar ${isDead ? 'dead' : ''}">${character.avatar}</div>
                        <div class="slot-info">
                            <div class="slot-name ${isDead ? 'dead' : ''}">${character.getDisplayName()}</div>
                            <div class="slot-meta">
                                <span class="slot-level">Lv.${character.level}</span>
                                <span class="slot-profession">${character.profession}</span>
                                ${isDead ? '<span class="slot-status dead">已死亡</span>' : ''}
                            </div>
                            <div class="slot-bars">
                                <div class="slot-bar health-bar">
                                    <div class="bar-fill ${isDead ? 'dead' : ''}" style="width: ${(character.currentHealth / character.maxHealth) * 100}%"></div>
                                    <div class="bar-text">HP: ${Math.floor(character.currentHealth)}/${Math.floor(character.maxHealth)}</div>
                                </div>
                                <div class="slot-bar mana-bar">
                                    <div class="bar-fill" style="width: ${(character.currentMana / character.maxMana) * 100}%"></div>
                                    <div class="bar-text">MP: ${Math.floor(character.currentMana)}/${Math.floor(character.maxMana)}</div>
                                </div>
                                <div class="slot-bar exp-bar">
                                    <div class="bar-fill" style="width: ${(character.currentExp / character.maxExp) * 100}%"></div>
                                    <div class="bar-text">EXP: ${Math.floor(character.currentExp)}/${Math.floor(character.maxExp)}</div>
                                </div>
                            </div>
                            ${reviveText}
                            <div class="slot-skills">
                                ${this.createSlotSkillsUI(character)}
                            </div>
                        </div>
                        <button class="remove-character-btn" title="移除角色">×</button>
                    </div>
                </div>
            `;
        }
    }
    
    // 创建槽位技能显示UI
    createSlotSkillsUI(character) {
        if (!character || !character.skills) return '';
        
        const activeSkills = character.skills.filter(skill => skill !== null);
        if (activeSkills.length === 0) return '<div class="slot-no-skills">无技能</div>';
        
        return activeSkills.map(skill => `
            <div class="slot-skill">
                <span class="skill-icon">${skill.icon}</span>
                <span class="skill-name">${skill.name}</span>
            </div>
        `).join('');
    }
    
    // 创建角色选择窗口技能显示UI
    createSelectionSkillsUI(character) {
        if (!character || !character.skills) return '';
        
        const activeSkills = character.skills.filter(skill => skill !== null);
        if (activeSkills.length === 0) return '<div class="selection-no-skills">无技能</div>';
        
        return activeSkills.map(skill => `
            <div class="selection-skill">
                <div class="selection-skill-header">
                    <span class="skill-icon">${skill.icon}</span>
                    <span class="skill-name">${skill.name}</span>
                </div>
            </div>
        `).join('');
    }
    
    // 创建战斗物品UI
    createBattleItemsUI(items, itemsPerPage, totalPages, tabType = 'consumable') {
        // 将物品按名称分组并计数
        const groupedItems = {};
        items.forEach(item => {
            if (groupedItems[item.name]) {
                groupedItems[item.name].count++;
            } else {
                groupedItems[item.name] = {
                    item: item,
                    count: 1
                };
            }
        });
        
        const uniqueItems = Object.values(groupedItems);
        
        // 根据标签页类型使用不同的页码
        const currentPage = tabType === 'drops' ? this.battleDropsPage : this.battleItemPage;
        const startIndex = currentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, uniqueItems.length);
        const pageItems = uniqueItems.slice(startIndex, endIndex);
        
        // 根据标签页类型显示不同的标题
        const tabTitle = tabType === 'drops' ? '掉落物' : '消耗品';
        
        return `
            <div class="battle-items-header">
                <span class="items-count">${tabTitle} (${uniqueItems.length})</span>
                ${totalPages > 1 ? `
                    <div class="battle-items-pagination">
                        <button class="page-btn prev-btn" data-tab-type="${tabType}" ${currentPage === 0 ? 'disabled' : ''}>‹</button>
                        <div class="page-dots">
                            ${Array.from({length: totalPages}, (_, i) => 
                                `<span class="page-dot ${i === currentPage ? 'active' : ''}" data-page="${i}" data-tab-type="${tabType}"></span>`
                            ).join('')}
                        </div>
                        <button class="page-btn next-btn" data-tab-type="${tabType}" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>›</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="battle-items-grid">
                ${pageItems.length > 0 ? pageItems.map((itemData, index) => `
                    <div class="battle-item" data-item-name="${itemData.item.name}" data-tab-type="${tabType}">
                        <div class="item-icon">${itemData.item.icon}</div>
                        <div class="item-name">${itemData.item.name}</div>
                        <div class="item-effect">${itemData.item.effect}</div>
                        <div class="item-count">数量: ${itemData.count}</div>
                        ${tabType === 'consumable' ? `
                            <div class="item-actions">
                                <button class="item-btn use-btn">使用</button>
                                <button class="item-btn sell-btn">出售</button>
                            </div>
                        ` : `
                            <div class="item-actions">
                                <div class="item-source">来源: ${this.getDropItemSource(itemData.item.name)}</div>
                            </div>
                        `}
                    </div>
                `).join('') : `<div class="no-items">没有${tabTitle}</div>`}
            </div>
        `;
    }
    
    // 一键编队功能
    autoFillTeam() {
        // 获取所有可用的角色（不包括NPC和已死亡的角色）
        const availableCharacters = this.characters.filter(char => 
            !char.isNPC && !char.isDead && !this.battleTeam.includes(char)
        );
        
        if (availableCharacters.length === 0) {
            console.log('没有可用的角色进行编队');
            return;
        }
        
        // 按等级排序（降序），等级相同则随机排序
        availableCharacters.sort((a, b) => {
            if (b.level !== a.level) {
                return b.level - a.level; // 等级高的在前
            }
            return Math.random() - 0.5; // 等级相同则随机
        });
        
        // 填充空槽位
        let filledCount = 0;
        for (let i = 0; i < this.battleTeam.length; i++) {
            if (!this.battleTeam[i] && availableCharacters.length > 0) {
                const character = availableCharacters.shift();
                this.battleTeam[i] = character;
                
                // 在关卡中生成角色（使用spawnCharacterInLevel方法，包含移动系统初始化）
                if (this.currentLevel && (this.currentLevel.id === 7 || this.currentLevel.id === 8)) {
                    this.spawnCharacterInLevel(character);
                    character.isInBattle = true;
                    console.log(`角色 ${character.getDisplayName()} 已生成并开始移动`);
                }
                
                filledCount++;
                console.log(`一键编队: 将 ${character.getDisplayName()} (等级${character.level}) 添加到槽位${i}`);
            }
        }
        
        // 刷新战斗面板UI
        this.initBattlePanel();
        
        console.log(`一键编队完成，共添加 ${filledCount} 个角色`);
        console.log(`当前编队:`, this.battleTeam.map(c => c ? c.getDisplayName() : '空').join(', '));
    }
    
    // 绑定战斗面板事件
    bindBattleEvents(container) {
        // 绑定编队槽位点击事件
        const teamSlots = container.querySelectorAll('.team-slot');
        teamSlots.forEach(slot => {
            const slotIndex = parseInt(slot.dataset.slotIndex);
            
            if (slot.classList.contains('empty')) {
                // 空槽位点击 - 显示角色选择
                slot.addEventListener('click', () => {
                    this.showCharacterSelection(slotIndex);
                });
            } else {
                // 有角色的槽位 - 绑定移除按钮
                const removeBtn = slot.querySelector('.remove-character-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeCharacterFromTeam(slotIndex);
                    });
                }
            }
        });
        
        // 绑定物品仓库标签页切换事件
        const warehouseTabs = container.querySelectorAll('.warehouse-tab');
        warehouseTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                if (this.battleItemTab !== tabType) {
                    this.battleItemTab = tabType;
                    this.initBattlePanel(); // 重新渲染面板
                }
            });
        });
        
        // 绑定翻页事件
        const prevBtns = container.querySelectorAll('.prev-btn');
        const nextBtns = container.querySelectorAll('.next-btn');
        const pageDots = container.querySelectorAll('.page-dot');
        
        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabType = btn.dataset.tabType;
                if (tabType === 'drops') {
                    if (this.battleDropsPage > 0) {
                        this.battleDropsPage--;
                        this.initBattlePanel();
                    }
                } else {
                    if (this.battleItemPage > 0) {
                        this.battleItemPage--;
                        this.initBattlePanel();
                    }
                }
            });
        });
        
        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabType = btn.dataset.tabType;
                let items, totalPages;
                
                if (tabType === 'drops') {
                    items = this.levelDrops.map(drop => drop.item);
                    totalPages = Math.ceil(items.length / 6);
                    if (this.battleDropsPage < totalPages - 1) {
                        this.battleDropsPage++;
                        this.initBattlePanel();
                    }
                } else {
                    items = this.inventory.filter(item => item.type === '消耗品');
                    totalPages = Math.ceil(items.length / 6);
                    if (this.battleItemPage < totalPages - 1) {
                        this.battleItemPage++;
                        this.initBattlePanel();
                    }
                }
            });
        });
        
        pageDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const page = parseInt(dot.dataset.page);
                const tabType = dot.dataset.tabType;
                
                if (tabType === 'drops') {
                    this.battleDropsPage = page;
                } else {
                    this.battleItemPage = page;
                }
                this.initBattlePanel();
            });
        });
        
        // 绑定物品使用和出售事件（仅对消耗品标签页）
        const battleItems = container.querySelectorAll('.battle-item[data-item-name]');
        battleItems.forEach(itemElement => {
            const itemName = itemElement.dataset.itemName;
            const tabType = itemElement.dataset.tabType;
            
            if (tabType === 'consumable') {
                const useBtn = itemElement.querySelector('.use-btn');
                const sellBtn = itemElement.querySelector('.sell-btn');
                
                if (useBtn) {
                    useBtn.addEventListener('click', () => {
                        this.showItemTargetSelection(itemName);
                    });
                }
                
                if (sellBtn) {
                    sellBtn.addEventListener('click', () => {
                        this.sellConsumableItem(itemName);
                    });
                }
            }
        });
        
        // 绑定编队槽位悬停事件
        this.bindTeamSlotHoverEvents(container);
    }
    
    // 绑定编队槽位悬停事件
    bindTeamSlotHoverEvents(container) {
        const teamSlots = container.querySelectorAll('.team-slot.filled');
        
        teamSlots.forEach(slot => {
            const slotIndex = parseInt(slot.dataset.slotIndex);
            const character = this.battleTeam[slotIndex];
            
            if (character) {
                // 鼠标进入事件
                slot.addEventListener('mouseenter', () => {
                    this.showGameAreaHoverDetail(character);
                });
                
                // 鼠标离开事件
                slot.addEventListener('mouseleave', () => {
                    this.hideGameAreaHoverDetail();
                });
            }
        });
    }
    
    // 在关卡区域显示悬停详情
    showGameAreaHoverDetail(character) {
        // 获取游戏区域容器
        const gameArea = document.getElementById('gameArea');
        if (!gameArea) return;
        
        // 移除现有的悬停详情面板
        this.hideGameAreaHoverDetail();
        
        // 创建悬停详情面板
        const hoverDetail = document.createElement('div');
        hoverDetail.id = 'gameAreaHoverDetail';
        hoverDetail.className = 'game-area-hover-detail';
        
        hoverDetail.innerHTML = `
            <div class="hover-detail-content">
                <div class="hover-detail-header">
                    <div class="hover-detail-title">角色详情</div>
                </div>
                <div class="hover-detail-body">
                    ${this.createHoverDetailContent(character)}
                </div>
            </div>
        `;
        
        // 添加到游戏区域
        gameArea.appendChild(hoverDetail);
        
        // 显示面板
        hoverDetail.style.display = 'block';
    }
    
    // 隐藏关卡区域悬停详情
    hideGameAreaHoverDetail() {
        const existingDetail = document.getElementById('gameAreaHoverDetail');
        if (existingDetail) {
            existingDetail.remove();
        }
    }
    
    // 创建悬停详情内容
    createHoverDetailContent(character) {
        const isDead = character.isDead || character.currentHealth <= 0;
        const reviveText = character.isDead && character.reviveCountdown > 0 ? 
            `<div class="hover-revive-countdown">复活倒计时: ${Math.floor(character.reviveCountdown)}秒</div>` : '';
        
        return `
            <div class="hover-character-info">
                <div class="hover-character-header">
                    <div class="hover-character-avatar ${isDead ? 'dead' : ''}">${character.avatar}</div>
                    <div class="hover-character-basic">
                        <div class="hover-character-name ${isDead ? 'dead' : ''}">${character.getDisplayName()}</div>
                        <div class="hover-character-meta">
                            <span class="hover-level">等级 ${character.level}</span>
                            <span class="hover-profession">${character.profession}</span>
                            ${isDead ? '<span class="hover-status dead">已死亡</span>' : ''}
                        </div>
                        ${reviveText}
                    </div>
                </div>
                
                <div class="hover-character-stats">
                    <div class="hover-stats-section">
                        <div class="hover-section-title">状态</div>
                        <div class="hover-stat-bars">
                            <div class="hover-stat-bar">
                                <div class="hover-bar-label">生命值</div>
                                <div class="hover-bar-container">
                                    <div class="hover-bar-fill health ${isDead ? 'dead' : ''}" style="width: ${(character.currentHealth / character.maxHealth) * 100}%"></div>
                                    <div class="hover-bar-text">${Math.floor(character.currentHealth)}/${Math.floor(character.maxHealth)}</div>
                                </div>
                            </div>
                            <div class="hover-stat-bar">
                                <div class="hover-bar-label">魔法值</div>
                                <div class="hover-bar-container">
                                    <div class="hover-bar-fill mana" style="width: ${(character.currentMana / character.maxMana) * 100}%"></div>
                                    <div class="hover-bar-text">${Math.floor(character.currentMana)}/${Math.floor(character.maxMana)}</div>
                                </div>
                            </div>
                            <div class="hover-stat-bar">
                                <div class="hover-bar-label">经验值</div>
                                <div class="hover-bar-container">
                                    <div class="hover-bar-fill exp" style="width: ${(character.currentExp / character.maxExp) * 100}%"></div>
                                    <div class="hover-bar-text">${Math.floor(character.currentExp)}/${Math.floor(character.maxExp)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="hover-stats-section">
                        <div class="hover-section-title">主属性</div>
                        <div class="hover-attributes">
                            <div class="hover-attr-item">
                                <span class="hover-attr-icon">💪</span>
                                <span class="hover-attr-label">力量</span>
                                <span class="hover-attr-value">${character.attributes.strength}</span>
                            </div>
                            <div class="hover-attr-item">
                                <span class="hover-attr-icon">🏃</span>
                                <span class="hover-attr-label">敏捷</span>
                                <span class="hover-attr-value">${character.attributes.agility}</span>
                            </div>
                            <div class="hover-attr-item">
                                <span class="hover-attr-icon">🧠</span>
                                <span class="hover-attr-label">智力</span>
                                <span class="hover-attr-value">${character.attributes.intelligence}</span>
                            </div>
                            <div class="hover-attr-item">
                                <span class="hover-attr-icon">🔧</span>
                                <span class="hover-attr-label">技巧</span>
                                <span class="hover-attr-value">${character.attributes.skill}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="hover-stats-section">
                        <div class="hover-section-title">副属性</div>
                        <div class="hover-secondary-attributes">
                            <div class="hover-secondary-attr">
                                <span class="hover-secondary-label">攻击力</span>
                                <span class="hover-secondary-value">${character.secondaryAttributes.attackPower.toFixed(1)}</span>
                            </div>
                            <div class="hover-secondary-attr">
                                <span class="hover-secondary-label">防御力</span>
                                <span class="hover-secondary-value">${character.secondaryAttributes.defense.toFixed(1)}</span>
                            </div>
                            <div class="hover-secondary-attr">
                                <span class="hover-secondary-label">移动速度</span>
                                <span class="hover-secondary-value">${character.secondaryAttributes.moveSpeed.toFixed(1)}</span>
                            </div>
                            <div class="hover-secondary-attr">
                                <span class="hover-secondary-label">生命恢复</span>
                                <span class="hover-secondary-value">${character.secondaryAttributes.healthRegen.toFixed(1)}/秒</span>
                            </div>
                            <div class="hover-secondary-attr">
                                <span class="hover-secondary-label">魔法恢复</span>
                                <span class="hover-secondary-value">${character.secondaryAttributes.manaRegen.toFixed(1)}/秒</span>
                            </div>
                            <div class="hover-secondary-attr">
                                <span class="hover-secondary-label">体重</span>
                                <span class="hover-secondary-value">${character.secondaryAttributes.weight}kg</span>
                            </div>
                            <div class="hover-secondary-attr">
                                <span class="hover-secondary-label">体积</span>
                                <span class="hover-secondary-value">${character.secondaryAttributes.volume}L</span>
                            </div>
                            <div class="hover-secondary-attr">
                                <span class="hover-secondary-label">经验值获取量</span>
                                <span class="hover-secondary-value">${character.secondaryAttributes.expGain}%</span>
                            </div>
                        </div>
                    </div>
                    
                    ${character.skills && character.skills.length > 0 ? `
                    <div class="hover-stats-section">
                        <div class="hover-section-title">技能</div>
                        <div class="hover-skills">
                            ${character.skills.filter(skill => skill !== null).map(skill => `
                                <div class="hover-skill-item">
                                    <span class="hover-skill-icon">${skill.icon}</span>
                                    <span class="hover-skill-name">${skill.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // 显示角色选择面板
    showCharacterSelection(slotIndex) {
        // 可用角色（活着且不在编队中）
        const availableCharacters = this.characters.filter(char => 
            char.type === 'Player' && !this.battleTeam.includes(char) && !char.isDead && char.currentHealth > 0
        );
        
        // 死亡角色（显示复活倒计时，但不可选择）
        const deadCharacters = this.characters.filter(char => 
            char.type === 'Player' && !this.battleTeam.includes(char) && char.isDead
        );
        
        const modal = document.createElement('div');
        modal.className = 'character-selection-modal';
        modal.innerHTML = `
            <div class="character-selection-content">
                <div class="selection-header">
                    <div class="selection-title">选择角色</div>
                    <button class="close-selection-btn">×</button>
                </div>
                
                <div class="character-selection-grid">
                    ${availableCharacters.length > 0 ? availableCharacters.map((char, index) => `
                        <div class="selectable-character available" data-character-index="${index}">
                            <div class="character-avatar-small">${char.avatar}</div>
                            <div class="character-name-small">${char.getDisplayName()}</div>
                            <div class="character-level-small">Lv.${char.level}</div>
                            ${char.type !== 'NPC' ? `<div class="character-profession-small">${char.profession}</div>` : ''}
                            <div class="character-skills-small">
                                ${this.createSelectionSkillsUI(char)}
                            </div>
                            <div class="character-status-small available">可用</div>
                        </div>
                    `).join('') : ''}
                    
                    ${deadCharacters.length > 0 ? deadCharacters.map((char, index) => `
                        <div class="selectable-character dead" data-dead-character-index="${index}">
                            <div class="character-avatar-small dead">${char.avatar}</div>
                            <div class="character-name-small dead">${char.getDisplayName()}</div>
                            <div class="character-level-small dead">Lv.${char.level}</div>
                            ${char.type !== 'NPC' ? `<div class="character-profession-small dead">${char.profession}</div>` : ''}
                            <div class="character-skills-small">
                                ${this.createSelectionSkillsUI(char)}
                            </div>
                            <div class="character-status-small dead">
                                ${char.reviveCountdown > 0 ? `复活倒计时: ${Math.floor(char.reviveCountdown)}s` : '已死亡'}
                            </div>
                        </div>
                    `).join('') : ''}
                    
                    ${availableCharacters.length === 0 && deadCharacters.length === 0 ? 
                        '<div class="no-characters">没有可用角色</div>' : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
        
        // 绑定关闭事件
        modal.querySelector('.close-selection-btn').addEventListener('click', () => {
            this.closeCharacterSelection(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCharacterSelection(modal);
            }
        });
        
        // 绑定角色选择事件（只对可用角色）
        const availableChars = modal.querySelectorAll('.selectable-character.available');
        availableChars.forEach(charElement => {
            charElement.addEventListener('click', () => {
                const charIndex = parseInt(charElement.dataset.characterIndex);
                const selectedCharacter = availableCharacters[charIndex];
                this.addCharacterToTeam(selectedCharacter, slotIndex);
                this.closeCharacterSelection(modal);
            });
        });
        
        // 为死亡角色添加点击提示（不可选择）
        const deadChars = modal.querySelectorAll('.selectable-character.dead');
        deadChars.forEach(charElement => {
            charElement.addEventListener('click', () => {
                const charIndex = parseInt(charElement.dataset.deadCharacterIndex);
                const deadCharacter = deadCharacters[charIndex];
                if (deadCharacter.reviveCountdown > 0) {
                    alert(`${deadCharacter.getDisplayName()} 正在复活中，还需要 ${Math.floor(deadCharacter.reviveCountdown)} 秒`);
                } else {
                    alert(`${deadCharacter.getDisplayName()} 已死亡，无法选择`);
                }
            });
        });
    }
    
    // 关闭角色选择面板
    closeCharacterSelection(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    // 添加角色到编队
    addCharacterToTeam(character, slotIndex) {
        this.battleTeam[slotIndex] = character;
        
        // 如果是在草原关卡或森林关卡，将角色生成到关卡区域中
        if (this.currentLevel && (this.currentLevel.id === 7 || this.currentLevel.id === 8)) {
            this.spawnCharacterInLevel(character);
        }
        
        this.initBattlePanel(); // 刷新界面
        console.log(`添加角色 ${character.getDisplayName()} 到槽位 ${slotIndex}`);
    }
    
    // 在关卡中生成角色
    spawnCharacterInLevel(character) {
        // 为角色添加位置和移动属性
        character.x = 0;
        character.y = 0;
        character.radius = (character.secondaryAttributes.volume / 100) * 25; // 基于体积计算半径
        character.directionX = 0;
        character.directionY = 0;
        character.finalMoveSpeed = 20 + (character.secondaryAttributes.moveSpeed * 0.5); // 移动速度公式
        
        // 寻找远离敌人的位置
        const bestPosition = this.findSafeSpawnPosition(character);
        character.x = bestPosition.x;
        character.y = bestPosition.y;
        
        // 设置随机移动方向
        const angle = Math.random() * 2 * Math.PI;
        character.directionX = Math.cos(angle);
        character.directionY = Math.sin(angle);
        
        console.log(`角色 ${character.getDisplayName()} 生成在位置 (${Math.round(character.x)}, ${Math.round(character.y)})，移动速度: ${character.finalMoveSpeed}`);
    }
    
    // 寻找安全的生成位置（远离敌人和其他玩家角色）
    findSafeSpawnPosition(character) {
        const margin = character.radius + 10;
        const maxAttempts = 50;
        let bestPosition = null;
        let maxMinDistance = 0;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = margin + Math.random() * (this.canvas.width - 2 * margin);
            const y = margin + Math.random() * (this.canvas.height - 2 * margin);
            
            let minDistance = Infinity;
            let validPosition = true;
            
            // 检查与敌人的距离
            for (const enemy of this.enemies) {
                const distance = Math.sqrt(Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2));
                const requiredDistance = character.radius + enemy.radius + 30; // 碰撞体积 + 安全距离
                minDistance = Math.min(minDistance, distance);
                
                if (distance < requiredDistance) {
                    validPosition = false;
                    break;
                }
            }
            
            // 检查与其他玩家角色的距离
            if (validPosition) {
                for (const otherCharacter of this.battleTeam) {
                    if (otherCharacter && otherCharacter !== character && 
                        otherCharacter.x !== undefined && otherCharacter.y !== undefined) {
                        const distance = Math.sqrt(Math.pow(x - otherCharacter.x, 2) + Math.pow(y - otherCharacter.y, 2));
                        const requiredDistance = character.radius + otherCharacter.radius + 30; // 碰撞体积 + 安全距离
                        minDistance = Math.min(minDistance, distance);
                        
                        if (distance < requiredDistance) {
                            validPosition = false;
                            break;
                        }
                    }
                }
            }
            
            // 如果没有敌人和其他玩家角色，直接使用这个位置
            if (this.enemies.length === 0 && this.battleTeam.filter(char => char && char.x !== undefined && char !== character).length === 0) {
                return { x, y };
            }
            
            // 只考虑距离足够远的位置
            if (validPosition && minDistance > maxMinDistance) {
                maxMinDistance = minDistance;
                bestPosition = { x, y };
            }
        }
        
        // 如果找不到合适位置，使用画布中心
        return bestPosition || { 
            x: this.canvas.width / 2, 
            y: this.canvas.height / 2 
        };
    }
    
    // 寻找安全的敌人生成位置（远离玩家角色和其他敌人）
    findSafeEnemySpawnPosition(enemy) {
        const margin = enemy.radius + 10;
        const maxAttempts = 50;
        let bestPosition = null;
        let maxMinDistance = 0;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = margin + Math.random() * (this.canvas.width - 2 * margin);
            const y = margin + Math.random() * (this.canvas.height - 2 * margin);
            
            let minDistance = Infinity;
            let validPosition = true;
            
            // 检查与玩家角色的距离
            for (const character of this.battleTeam) {
                if (character && character.x !== undefined && character.y !== undefined) {
                    const distance = Math.sqrt(Math.pow(x - character.x, 2) + Math.pow(y - character.y, 2));
                    const requiredDistance = enemy.radius + character.radius + 30; // 碰撞体积 + 安全距离
                    minDistance = Math.min(minDistance, distance);
                    
                    if (distance < requiredDistance) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // 检查与其他敌人的距离
            if (validPosition) {
                for (const otherEnemy of this.enemies) {
                    const distance = Math.sqrt(Math.pow(x - otherEnemy.x, 2) + Math.pow(y - otherEnemy.y, 2));
                    const requiredDistance = enemy.radius + otherEnemy.radius + 20; // 碰撞体积 + 安全距离
                    minDistance = Math.min(minDistance, distance);
                    
                    if (distance < requiredDistance) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // 如果没有玩家角色和其他敌人，直接使用这个位置
            if (this.battleTeam.filter(char => char && char.x !== undefined).length === 0 && this.enemies.length === 0) {
                return { x, y };
            }
            
            // 只考虑距离足够远的位置
            if (validPosition && minDistance > maxMinDistance) {
                maxMinDistance = minDistance;
                bestPosition = { x, y };
            }
        }
        
        // 如果找不到合适位置，在画布边缘随机选择一个位置
        if (!bestPosition) {
            const side = Math.floor(Math.random() * 4); // 0=上, 1=右, 2=下, 3=左
            switch (side) {
                case 0: // 上边
                    return { x: Math.random() * this.canvas.width, y: margin };
                case 1: // 右边
                    return { x: this.canvas.width - margin, y: Math.random() * this.canvas.height };
                case 2: // 下边
                    return { x: Math.random() * this.canvas.width, y: this.canvas.height - margin };
                case 3: // 左边
                    return { x: margin, y: Math.random() * this.canvas.height };
            }
        }
        
        return bestPosition;
    }
    
    // 显示物品使用目标选择
    showItemTargetSelection(itemName) {
        // 获取编队中的角色作为可选目标
        const availableTargets = this.battleTeam.filter(char => char !== null);
        
        if (availableTargets.length === 0) {
            alert('编队中没有角色可以使用物品！');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'item-target-modal';
        modal.innerHTML = `
            <div class="item-target-content">
                <div class="target-header">
                    <div class="target-title">选择使用目标</div>
                    <button class="close-target-btn">×</button>
                </div>
                
                <div class="target-item-info">
                    <div class="target-item-name">使用物品: ${itemName}</div>
                </div>
                
                <div class="target-selection-grid">
                    ${availableTargets.map((char, index) => {
                        const canUse = this.canUseItemOnTarget(itemName, char);
                        return `
                            <div class="target-character ${canUse ? '' : 'disabled'}" data-target-index="${this.battleTeam.indexOf(char)}">
                                <div class="target-avatar">${char.avatar}</div>
                                <div class="target-name">${char.getDisplayName()}</div>
                                <div class="target-status">
                                    <div class="target-hp">HP: ${Math.floor(char.currentHealth)}/${Math.floor(char.maxHealth)}</div>
                                    <div class="target-mp">MP: ${Math.floor(char.currentMana)}/${Math.floor(char.maxMana)}</div>
                                </div>
                                ${!canUse ? '<div class="target-disabled-reason">不满足使用条件</div>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
        
        // 绑定关闭事件
        modal.querySelector('.close-target-btn').addEventListener('click', () => {
            this.closeItemTargetSelection(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeItemTargetSelection(modal);
            }
        });
        
        // 绑定目标选择事件
        const targetChars = modal.querySelectorAll('.target-character:not(.disabled)');
        targetChars.forEach(targetElement => {
            targetElement.addEventListener('click', () => {
                const targetIndex = parseInt(targetElement.dataset.targetIndex);
                const targetCharacter = this.battleTeam[targetIndex];
                this.useItemOnTarget(itemName, targetCharacter);
                this.closeItemTargetSelection(modal);
            });
        });
    }
    
    // 关闭物品目标选择面板
    closeItemTargetSelection(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    // 检查是否可以对目标使用物品
    canUseItemOnTarget(itemName, character) {
        // 基本要求：当前生命值 > 1 且不是死亡状态
        if (character.currentHealth <= 1 || character.isDead) {
            return false;
        }
        
        // 根据物品类型检查特殊要求
        switch(itemName) {
            case '绷带':
                // 绷带：生命值未满才能使用
                return character.currentHealth < character.maxHealth;
            case '魔力胶囊':
                // 魔力胶囊：魔法值未满才能使用
                return character.currentMana < character.maxMana;
            case '香草药剂':
                // 香草药剂：生命值未满才能使用
                return character.currentHealth < character.maxHealth;
            case '经验笔记':
                // 经验笔记：任何活着的角色都可以使用
                return true;
            default:
                return true;
        }
    }
    
    // 对目标使用物品
    useItemOnTarget(itemName, character) {
        // 找到对应的物品
        const itemIndex = this.inventory.findIndex(item => 
            item.type === '消耗品' && item.name === itemName
        );
        
        if (itemIndex === -1) {
            console.log('没有找到物品:', itemName);
            return;
        }
        
        const item = this.inventory[itemIndex];
        let success = false;
        
        // 根据物品类型应用效果
        switch(itemName) {
            case '绷带':
                character.currentHealth = Math.min(
                    character.currentHealth + 20,
                    character.maxHealth
                );
                success = true;
                break;
            case '魔力胶囊':
                character.currentMana = Math.min(
                    character.currentMana + 100,
                    character.maxMana
                );
                success = true;
                break;
            case '香草药剂':
                // 香草药剂：治疗量为 15 + 该角色最大生命值20%
                const healAmount = 15 + Math.floor(character.maxHealth * 0.2);
                character.currentHealth = Math.min(
                    character.currentHealth + healAmount,
                    character.maxHealth
                );
                success = true;
                break;
            case '经验笔记':
                // 经验笔记：增加经验值 50 + 角色最大经验值10%
                const expGain = 50 + Math.floor(character.maxExp * 0.1);
                character.currentExp += expGain;
                
                // 检查是否升级
                while (character.currentExp >= character.maxExp && character.level < 100) {
                    character.levelUp();
                }
                
                success = true;
                break;
            default:
                console.log('未知物品效果:', itemName);
                return;
        }
        
        if (success) {
            // 从背包中移除使用的物品
            this.inventory.splice(itemIndex, 1);
            
            // 刷新战斗面板
            this.initBattlePanel();
            
            console.log(`${character.getDisplayName()} 使用了 ${itemName}`);
        }
    }
    
    // 出售消耗品
    sellConsumableItem(itemName) {
        // 找到对应的物品
        const itemIndex = this.inventory.findIndex(item => 
            item.type === '消耗品' && item.name === itemName
        );
        
        if (itemIndex === -1) {
            console.log('没有找到物品:', itemName);
            return;
        }
        
        const item = this.inventory[itemIndex];
        const sellPrice = item.sellPrice;
        
        // 从背包中移除物品
        this.inventory.splice(itemIndex, 1);
        
        // 增加金币
        this.gold += sellPrice;
        this.updateGoldDisplay();
        
        // 刷新战斗面板
        this.initBattlePanel();
        
        console.log(`出售了 ${itemName}，获得 ${sellPrice} 金币`);
    }
    
    // 清空所有编队槽位
    clearAllTeamSlots() {
        this.battleTeam.forEach((character, index) => {
            if (character) {
                // 清除角色的位置信息（从关卡中移除）
                if (character.x !== undefined) {
                    delete character.x;
                    delete character.y;
                    delete character.radius;
                    delete character.directionX;
                    delete character.directionY;
                    delete character.finalMoveSpeed;
                }
                console.log(`从槽位 ${index} 移除角色 ${character.getDisplayName()}`);
            }
        });
        
        // 清空整个编队数组
        this.battleTeam = [null, null, null, null];
        console.log('所有编队槽位已清空');
        
        // 额外保护：确保BOSS状态不受影响
        this.protectBossIntegrity();
    }
    
    // 从编队中移除角色
    removeCharacterFromTeam(slotIndex) {
        const character = this.battleTeam[slotIndex];
        if (character) {
            // 清除角色的位置信息（从关卡中移除）
            if (character.x !== undefined) {
                delete character.x;
                delete character.y;
                delete character.radius;
                delete character.directionX;
                delete character.directionY;
                delete character.finalMoveSpeed;
            }
            
            this.battleTeam[slotIndex] = null;
            this.initBattlePanel(); // 刷新界面
            console.log(`从槽位 ${slotIndex} 移除角色 ${character.getDisplayName()}`);
            
            // 额外保护：确保BOSS状态不受影响
            this.protectBossIntegrity();
        }
    }
    
    // 保护BOSS完整性的方法
    protectBossIntegrity() {
        if (this.bossManager && this.bossManager.bossActive && this.bossManager.currentBoss) {
            const bossInEnemyList = this.enemies.includes(this.bossManager.currentBoss);
            if (!bossInEnemyList) {
                console.warn(`🛡️ 检测到BOSS不在敌人列表中，重新添加保护`);
                this.enemies.push(this.bossManager.currentBoss);
                // 确保BOSS生命值不为0
                if (this.bossManager.currentBoss.currentHealth <= 0) {
                    this.bossManager.currentBoss.currentHealth = Math.max(1, this.bossManager.currentBoss.maxHealth * 0.1);
                }
            }
        }
    }
    
    // 初始化角色面板
    initCharacterPanel() {
        const controlContent = document.querySelector('.control-content');
        if (!controlContent) {
            console.error('Control content not found');
            return;
        }
        
        console.log('初始化角色面板，当前角色:', this.currentCharacter ? this.currentCharacter.name : '无');
        
        if (this.currentCharacter) {
            try {
                this.createCharacterUI(controlContent);
                console.log('角色UI创建成功');
            } catch (error) {
                console.error('创建角色UI时出错:', error);
                controlContent.innerHTML = `<div style="color: red; padding: 20px;">创建角色UI时出错: ${error.message}</div>`;
            }
        } else {
            this.createEmptyUI(controlContent);
        }
        console.log('Character panel created');
    }
    
    // 创建角色UI
    createCharacterUI(container) {
        const character = this.currentCharacter;
        
        // 如果是NPC角色，显示简化信息
        if (character.type === 'NPC') {
            this.createNPCUI(container, character);
        } else {
            this.createPlayerUI(container, character);
        }
    }
    
    // 创建NPC简化UI
    createNPCUI(container, character) {
        console.log('创建NPC UI，角色名:', character.name);
        
        try {
            if (character.name === '孵化师') {
                this.createIncubatorUI(container, character);
            } else if (character.name === '商人') {
                this.createMerchantUI(container, character);
            } else if (character.name === '仓库管理员') {
                this.createWarehouseUI(container, character);
            } else if (character.name === '角色管理员') {
                this.createCharacterManagerUI(container, character);
            } else if (character.name === '村长') {
                this.createVillageChiefUI(container, character);
            } else if (character.name === '手艺人') {
                this.createCraftsmanUI(container, character);
            } else if (character.name === '记录员') {
                this.createRecorderUI(container, character);
            } else if (character.name === '厨子') {
                this.createChefUI(container, character);
            } else if (character.name === '农夫') {
                this.createFarmerUI(container, character);
            } else {
                console.log('创建默认NPC UI');
                container.innerHTML = `
                    <div class="character-info">
                        <div class="character-header">
                            <div class="character-avatar">${character.avatar}</div>
                            <div class="character-details">
                                <div class="character-name">${character.getDisplayName()}</div>
                                <div class="character-meta">
                                    <span class="character-type">${character.type}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="npc-description">
                        <div class="section-title">角色介绍</div>
                        <div class="npc-info">
                            ${this.getNPCDescription(character.name)}
                        </div>
                    </div>
                `;
            }
            console.log('NPC UI创建完成');
        } catch (error) {
            console.error('创建NPC UI时出错:', error);
            container.innerHTML = `<div style="color: red; padding: 20px;">创建NPC UI时出错: ${error.message}</div>`;
        }
    }
    
    // 创建孵化师UI
    createIncubatorUI(container, character) {
        const eggs = this.inventory.filter(item => item.type === '蛋');
        
        // 确保所有蛋都有必要的方法和属性结构
        eggs.forEach(egg => {
            // 确保蛋有完整的属性结构
            if (!egg.attributes) {
                egg.attributes = {
                    satiety: {
                        current: 0,
                        max: 100
                    }
                };
            }
            
            // 确保饱腹度属性存在
            if (!egg.attributes.satiety) {
                egg.attributes.satiety = {
                    current: 0,
                    max: 100
                };
            }
            
            // 确保饱腹度有current和max属性
            if (typeof egg.attributes.satiety.current === 'undefined') {
                egg.attributes.satiety.current = 0;
            }
            if (typeof egg.attributes.satiety.max === 'undefined') {
                egg.attributes.satiety.max = 100;
            }
            
            // 添加canHatch方法
            if (!egg.canHatch) {
                egg.canHatch = function() {
                    return this.attributes && this.attributes.satiety && 
                           this.attributes.satiety.current >= this.attributes.satiety.max;
                };
            }
            
            // 添加feedWithFood方法
            if (!egg.feedWithFood) {
                egg.feedWithFood = function(foodItem) {
                    if (foodItem.type !== '食物') {
                        return false;
                    }
                    
                    // 检查饱腹度是否已满
                    if (this.attributes.satiety.current >= this.attributes.satiety.max) {
                        return false;
                    }
                    
                    // 根据食物类型应用不同效果
                    switch(foodItem.name) {
                        case '米饭':
                            this.attributes.satiety.current = Math.min(
                                this.attributes.satiety.current + 15,
                                this.attributes.satiety.max
                            );
                            break;
                        case '牛奶':
                            this.attributes.satiety.current = Math.min(
                                this.attributes.satiety.current + 5,
                                this.attributes.satiety.max
                            );
                            if (this.attributes.strength) {
                                this.attributes.strength.current = Math.min(
                                    this.attributes.strength.current + 1,
                                    this.attributes.strength.max
                                );
                            }
                            break;
                        case '番茄':
                            this.attributes.satiety.current = Math.min(
                                this.attributes.satiety.current + 5,
                                this.attributes.satiety.max
                            );
                            if (this.attributes.vitality) {
                                this.attributes.vitality.current = Math.min(
                                    this.attributes.vitality.current + 1,
                                    this.attributes.vitality.max
                                );
                            }
                            break;
                        case '鸡腿':
                            this.attributes.satiety.current = Math.min(
                                this.attributes.satiety.current + 5,
                                this.attributes.satiety.max
                            );
                            if (this.attributes.cleverness) {
                                this.attributes.cleverness.current = Math.min(
                                    this.attributes.cleverness.current + 1,
                                    this.attributes.cleverness.max
                                );
                            }
                            break;
                        case '肉排':
                            this.attributes.satiety.current = Math.min(
                                this.attributes.satiety.current + 10,
                                this.attributes.satiety.max
                            );
                            if (this.attributes.wisdom) {
                                this.attributes.wisdom.current = Math.min(
                                    this.attributes.wisdom.current + 1,
                                    this.attributes.wisdom.max
                                );
                            }
                            break;
                        default:
                            // 未知食物，只增加饱腹度
                            this.attributes.satiety.current = Math.min(
                                this.attributes.satiety.current + 5,
                                this.attributes.satiety.max
                            );
                    }
                    
                    return true;
                };
            }
        });
        
        this.currentEggPage = this.currentEggPage || 0;
        const eggsPerPage = 1;
        const totalPages = Math.max(1, Math.ceil(eggs.length / eggsPerPage));
        const currentEgg = eggs[this.currentEggPage];
        
        // 修复当前蛋对象（如果存在）
        if (currentEgg) {
            this.fixEggAttributes(currentEgg);
        }
        
        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="incubator-section">
                ${eggs.length > 0 ? `
                    <div class="egg-list-header">
                        <span class="egg-count">蛋列表 (${eggs.length})</span>
                    </div>
                    ${eggs.length > 1 ? `
                        <div class="egg-pagination-container">
                            <div class="egg-pagination">
                                <button class="page-btn prev-btn" ${this.currentEggPage === 0 ? 'disabled' : ''}>‹</button>
                                <div class="page-dots">
                                    ${Array.from({length: totalPages}, (_, i) => 
                                        `<span class="page-dot ${i === this.currentEggPage ? 'active' : ''}" data-page="${i}"></span>`
                                    ).join('')}
                                </div>
                                <button class="page-btn next-btn" ${this.currentEggPage >= totalPages - 1 ? 'disabled' : ''}>›</button>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${this.createEggUI(currentEgg)}
                    
                    <div class="feeding-section">
                        <div class="feeding-title">🍽️ 选择食物投喂</div>
                        <div class="feeding-food-grid" id="feedingFoodGrid">
                            ${this.createFoodSelectionContent(currentEgg)}
                        </div>
                    </div>
                ` : '<div class="no-egg">背包中没有蛋</div>'}
            </div>
        `;
        
        // 绑定事件
        if (eggs.length > 0) {
            this.bindEggEvents(container, currentEgg);
            this.bindPaginationEvents(container);
        }
    }
    
    // 修复蛋的属性结构
    fixEggAttributes(egg) {
        // 确保蛋有完整的attributes结构
        if (!egg.attributes) {
            egg.attributes = {};
        }
        
        // 修复各个属性，保持原有值或使用默认值
        if (!egg.attributes.satiety) {
            egg.attributes.satiety = { current: 0, max: 100 };
        } else {
            if (typeof egg.attributes.satiety.current === 'undefined') egg.attributes.satiety.current = 0;
            if (typeof egg.attributes.satiety.max === 'undefined') egg.attributes.satiety.max = 100;
        }
        
        if (!egg.attributes.strength) {
            egg.attributes.strength = { current: 0, max: egg.generateMaxValue ? egg.generateMaxValue() : 10 };
        } else {
            if (typeof egg.attributes.strength.current === 'undefined') egg.attributes.strength.current = 0;
            if (typeof egg.attributes.strength.max === 'undefined') egg.attributes.strength.max = egg.generateMaxValue ? egg.generateMaxValue() : 10;
        }
        
        if (!egg.attributes.vitality) {
            egg.attributes.vitality = { current: 0, max: egg.generateMaxValue ? egg.generateMaxValue() : 10 };
        } else {
            if (typeof egg.attributes.vitality.current === 'undefined') egg.attributes.vitality.current = 0;
            if (typeof egg.attributes.vitality.max === 'undefined') egg.attributes.vitality.max = egg.generateMaxValue ? egg.generateMaxValue() : 10;
        }
        
        if (!egg.attributes.wisdom) {
            egg.attributes.wisdom = { current: 0, max: egg.generateMaxValue ? egg.generateMaxValue() : 10 };
        } else {
            if (typeof egg.attributes.wisdom.current === 'undefined') egg.attributes.wisdom.current = 0;
            if (typeof egg.attributes.wisdom.max === 'undefined') egg.attributes.wisdom.max = egg.generateMaxValue ? egg.generateMaxValue() : 10;
        }
        
        if (!egg.attributes.cleverness) {
            egg.attributes.cleverness = { current: 0, max: egg.generateMaxValue ? egg.generateMaxValue() : 10 };
        } else {
            if (typeof egg.attributes.cleverness.current === 'undefined') egg.attributes.cleverness.current = 0;
            if (typeof egg.attributes.cleverness.max === 'undefined') egg.attributes.cleverness.max = egg.generateMaxValue ? egg.generateMaxValue() : 10;
        }
        
        // 确保getRarityColor方法存在
        if (!egg.getRarityColor || typeof egg.getRarityColor !== 'function') {
            egg.getRarityColor = function() {
                const colors = {
                    '普通': '#FFFFFF',
                    '稀有': '#4A90E2',
                    '神话': '#9B59B6',
                    '传说': '#E67E22',
                    '特殊': '#27AE60'
                };
                return colors[this.rarity] || '#FFFFFF';
            };
        }
        
        // 确保canHatch方法存在
        if (!egg.canHatch || typeof egg.canHatch !== 'function') {
            egg.canHatch = function() {
                return this.attributes && this.attributes.satiety && 
                       this.attributes.satiety.current >= this.attributes.satiety.max;
            };
        }
        
        // 确保generateMaxValue方法存在
        if (!egg.generateMaxValue || typeof egg.generateMaxValue !== 'function') {
            egg.generateMaxValue = function() {
                const ranges = {
                    '普通': [0, 10],
                    '稀有': [0, 20],
                    '神话': [0, 50],
                    '传说': [0, 100],
                    '特殊': [0, 15]
                };
                const range = ranges[this.rarity] || [0, 10];
                return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
            };
        }
        
        // 确保hatch方法存在
        if (!egg.hatch || typeof egg.hatch !== 'function') {
            egg.hatch = function() {
                if (!this.canHatch()) {
                    return null;
                }
                
                // 随机选择角色类型
                const types = ['random_strength', 'random_agility', 'random_intelligence', 'random_skill'];
                const randomType = types[Math.floor(Math.random() * types.length)];
                
                // 创建基础角色
                const baseCharacter = new Character(CharacterPresets.getPreset(randomType));
                
                // 根据蛋的属性分配8点属性点
                this.distributeAttributePoints(baseCharacter);
                
                return baseCharacter;
            };
        }
        
        // 确保distributeAttributePoints方法存在
        if (!egg.distributeAttributePoints || typeof egg.distributeAttributePoints !== 'function') {
            egg.distributeAttributePoints = function(character) {
                const totalPoints = 8;
                const attributeNames = ['strength', 'agility', 'intelligence', 'skill'];
                
                // 第一步：完全随机分配8点属性点
                for (let i = 0; i < totalPoints; i++) {
                    const randomAttr = attributeNames[Math.floor(Math.random() * attributeNames.length)];
                    character.attributes[randomAttr]++;
                }
                
                console.log('随机分配8点后的属性:', {...character.attributes});
                
                // 第二步：根据蛋的当前属性值额外增加对应属性
                const eggBonuses = {
                    strength: this.attributes.strength.current,
                    agility: this.attributes.vitality.current,
                    intelligence: this.attributes.cleverness.current,
                    skill: this.attributes.wisdom.current
                };
                
                // 应用蛋属性加成
                character.attributes.strength += eggBonuses.strength;
                character.attributes.agility += eggBonuses.agility;
                character.attributes.intelligence += eggBonuses.intelligence;
                character.attributes.skill += eggBonuses.skill;
                
                console.log('蛋属性加成:', eggBonuses);
                console.log('最终角色属性:', character.attributes);
                
                // 重新计算副属性和生命值
                character.updateAttributes();
                
                // 将当前生命值设置为最大生命值
                character.currentHealth = character.maxHealth;
                
                // 孵化时解锁第一个技能槽（如果还没解锁的话）
                if (character.skillSlotLocks && character.skillSlotLocks[0]) {
                    if (typeof character.unlockSkillSlot === 'function') {
                        character.unlockSkillSlot(0);
                    }
                }
                
                // 孵化时解锁技能槽1并自动装备被动技能
                if (character.skillSlot1Locked) {
                    character.skillSlot1Locked = false;
                    character.skillSlot1PassiveOnly = true;
                }
            };
        }
        
        console.log('蛋属性已修复:', egg.name, egg.attributes);
    }
    
    // 修复角色的技能对象方法
    fixCharacterSkills(character) {
        if (!character || !character.skills) {
            return;
        }
        
        // 修复装备的技能
        character.skills.forEach((skill, index) => {
            if (skill && typeof skill === 'object') {
                this.fixSkillMethods(skill);
            }
        });
        
        // 修复已学技能
        if (character.learnedSkills && Array.isArray(character.learnedSkills)) {
            character.learnedSkills.forEach(skill => {
                if (skill && typeof skill === 'object') {
                    this.fixSkillMethods(skill);
                }
            });
        }
    }
    
    // 修复单个技能对象的方法
    fixSkillMethods(skill) {
        if (!skill || typeof skill !== 'object') {
            return;
        }
        
        // 确保getTypeText方法存在
        if (!skill.getTypeText || typeof skill.getTypeText !== 'function') {
            skill.getTypeText = function() {
                const typeTexts = {
                    'active': '主动技能',
                    'passive': '被动技能',
                    'profession': '职业技能',
                    'special': '特殊技能'
                };
                return typeTexts[this.type] || '未知类型';
            };
        }
        
        // 确保getLevelText方法存在
        if (!skill.getLevelText || typeof skill.getLevelText !== 'function') {
            skill.getLevelText = function() {
                return `Lv.${this.level}/${this.maxLevel}`;
            };
        }
        
        // 确保getCooldownText方法存在
        if (!skill.getCooldownText || typeof skill.getCooldownText !== 'function') {
            skill.getCooldownText = function() {
                if (this.cooldown === 0) return '无冷却';
                return `冷却: ${this.cooldown / 1000}秒`;
            };
        }
        
        // 确保getManaCostText方法存在
        if (!skill.getManaCostText || typeof skill.getManaCostText !== 'function') {
            skill.getManaCostText = function() {
                if (this.manaCost === 0) return '无消耗';
                return `消耗: ${this.manaCost}`;
            };
        }
    }
    
    // 创建蛋UI
    createEggUI(egg) {
        // 安全检查：确保蛋对象有完整的attributes结构
        if (!egg.attributes || !egg.attributes.satiety || !egg.attributes.strength || 
            !egg.attributes.vitality || !egg.attributes.wisdom || !egg.attributes.cleverness) {
            console.warn('蛋对象缺少完整的attributes，正在修复...', egg);
            this.fixEggAttributes(egg);
        }
        
        return `
            <div class="egg-container" style="border-color: ${egg.getRarityColor()}">
                <div class="egg-main-content">
                    <div class="egg-header-centered">
                        <div class="egg-icon">${egg.icon}</div>
                        <div class="egg-name ${egg.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${egg.getRarityColor()}">${egg.name}</div>
                        <div class="egg-description">${egg.description}</div>
                        <div class="egg-rarity">${egg.rarity}</div>
                    </div>
                    
                    <div class="egg-attributes-horizontal">
                        <div class="egg-attr-item">
                            <span class="attr-name">🍽️ 饱腹</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.satiety.current / egg.attributes.satiety.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.satiety.current}/${egg.attributes.satiety.max}</span>
                        </div>
                        <div class="egg-attr-item">
                            <span class="attr-name">💪 强壮</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.strength.current / egg.attributes.strength.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.strength.current}/${egg.attributes.strength.max}</span>
                        </div>
                        <div class="egg-attr-item">
                            <span class="attr-name">⚡ 活力</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.vitality.current / egg.attributes.vitality.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.vitality.current}/${egg.attributes.vitality.max}</span>
                        </div>
                        <div class="egg-attr-item">
                            <span class="attr-name">🧠 机灵</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.cleverness.current / egg.attributes.cleverness.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.cleverness.current}/${egg.attributes.cleverness.max}</span>
                        </div>
                        <div class="egg-attr-item">
                            <span class="attr-name">🔮 悟性</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.wisdom.current / egg.attributes.wisdom.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.wisdom.current}/${egg.attributes.wisdom.max}</span>
                        </div>
                    </div>
                </div>
                
                <div class="egg-actions">
                    <button class="egg-btn hatch-btn" ${!(egg.canHatch && egg.canHatch()) ? 'disabled' : ''}>
                        ${(egg.canHatch && egg.canHatch()) ? '🐣 孵化' : '🥚 未就绪'}
                    </button>
                    <button class="egg-btn discard-btn">🗑️ 丢弃</button>
                </div>
            </div>
        `;
    }
    
    // 创建食物选择内容
    createFoodSelectionContent(egg) {
        // 检查蛋是否已满
        const isEggFull = egg.attributes.satiety.current >= egg.attributes.satiety.max;
        
        if (isEggFull) {
            return '<div class="inline-no-food-message">🥚 蛋已饱腹，无需投喂<br>可以直接孵化了！</div>';
        }
        
        // 获取所有食物类型的物品
        const foodItems = this.inventory.filter(item => item.type === '食物');
        
        // 统计每种食物的数量
        const foodCounts = {};
        foodItems.forEach(food => {
            if (foodCounts[food.name]) {
                foodCounts[food.name].count++;
            } else {
                foodCounts[food.name] = {
                    item: food,
                    count: 1
                };
            }
        });
        
        const uniqueFoods = Object.values(foodCounts);
        
        if (uniqueFoods.length === 0) {
            return '<div class="inline-no-food-message">背包中没有食物<br>请先到商店购买食物</div>';
        }
        
        // 分页逻辑：每页显示8个食物（4列x2行）
        const foodsPerPage = 8;
        const totalPages = Math.ceil(uniqueFoods.length / foodsPerPage);
        const currentPage = Math.min(this.currentFoodPage, totalPages - 1);
        const startIndex = currentPage * foodsPerPage;
        const endIndex = Math.min(startIndex + foodsPerPage, uniqueFoods.length);
        const pageFoods = uniqueFoods.slice(startIndex, endIndex);
        
        // 生成食物网格HTML
        const foodGridHTML = pageFoods.map(foodData => {
            // 确保食物对象有getRarityColor方法
            if (!foodData.item.getRarityColor || typeof foodData.item.getRarityColor !== 'function') {
                foodData.item.getRarityColor = function() {
                    const colors = {
                        '普通': '#FFFFFF',
                        '稀有': '#4A90E2',
                        '神话': '#9B59B6',
                        '传说': '#E67E22',
                        '特殊': '#27AE60'
                    };
                    return colors[this.rarity] || '#FFFFFF';
                };
            }
            
            return `
                <div class="inline-feeding-food-item" data-food-name="${foodData.item.name}">
                    <div class="inline-food-icon">${foodData.item.icon}</div>
                    <div class="inline-food-info">
                        <div class="inline-food-name ${foodData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${foodData.item.getRarityColor()}">${foodData.item.name}</div>
                        <div class="inline-food-effect">${foodData.item.effect}</div>
                        <div class="inline-food-count">拥有 ${foodData.count}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // 生成分页HTML
        const paginationHTML = totalPages > 1 ? `
            <div class="feeding-pagination">
                ${Array.from({length: totalPages}, (_, i) => 
                    `<span class="feeding-page-dot ${i === currentPage ? 'active' : ''}" data-page="${i}"></span>`
                ).join('')}
                <div class="feeding-page-info">${currentPage + 1}/${totalPages}</div>
            </div>
        ` : '';
        
        return foodGridHTML + paginationHTML;
    }
    
    // 绑定蛋相关事件
    bindEggEvents(container, egg) {
        const hatchBtn = container.querySelector('.hatch-btn');
        const discardBtn = container.querySelector('.discard-btn');
        
        if (hatchBtn && !hatchBtn.disabled) {
            hatchBtn.addEventListener('click', () => {
                // 保存蛋的引用用于显示贡献信息
                this.hatchedEgg = egg;
                
                const newCharacter = egg.hatch();
                if (newCharacter) {
                    this.showHatchedCharacter(newCharacter);
                    // 从背包中移除这个特定的蛋
                    const eggIndex = this.inventory.indexOf(egg);
                    if (eggIndex > -1) {
                        this.inventory.splice(eggIndex, 1);
                    }
                    // 调整当前页面索引
                    const eggs = this.inventory.filter(item => item.type === '蛋');
                    if (this.currentEggPage >= eggs.length && this.currentEggPage > 0) {
                        this.currentEggPage--;
                    }
                    this.initCharacterPanel(); // 刷新UI
                }
            });
        }
        
        if (discardBtn) {
            discardBtn.addEventListener('click', () => {
                this.showDiscardConfirmation(egg);
            });
        }
        
        // 绑定食物点击事件
        this.bindFoodSelectionEvents(container, egg);
    }
    
    // 绑定食物选择事件
    bindFoodSelectionEvents(container, egg) {
        const foodItems = container.querySelectorAll('.inline-feeding-food-item[data-food-name]');
        foodItems.forEach(foodElement => {
            foodElement.addEventListener('click', () => {
                const foodName = foodElement.dataset.foodName;
                const success = this.feedEggWithFood(egg, foodName);
                
                if (success) {
                    // 保存当前滚动位置
                    const controlContent = document.querySelector('.control-content');
                    const scrollTop = controlContent ? controlContent.scrollTop : 0;
                    
                    // 刷新孵化师界面
                    this.initCharacterPanel();
                    
                    // 恢复滚动位置
                    if (controlContent) {
                        controlContent.scrollTop = scrollTop;
                    }
                }
            });
        });
        
        // 绑定食物分页事件
        const pageDots = container.querySelectorAll('.feeding-page-dot');
        pageDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const page = parseInt(dot.dataset.page);
                this.currentFoodPage = page;
                
                // 保存当前滚动位置
                const controlContent = document.querySelector('.control-content');
                const scrollTop = controlContent ? controlContent.scrollTop : 0;
                
                // 刷新孵化师界面
                this.initCharacterPanel();
                
                // 恢复滚动位置
                if (controlContent) {
                    controlContent.scrollTop = scrollTop;
                }
            });
        });
    }
    
    // 显示孵化出的角色
    showHatchedCharacter(character) {
        this.hatchedCharacter = character;
        
        // 将角色添加到角色仓库
        this.characters.push(character);
        
        // 创建模态框显示角色信息
        const modal = document.createElement('div');
        modal.className = 'hatch-modal';
        modal.innerHTML = `
            <div class="hatch-modal-content">
                <div class="fireworks-container">
                    ${this.createFireworks()}
                </div>
                <div class="hatch-title">🎉 孵化成功！</div>
                <div class="hatched-character">
                    <div class="character-avatar large">${character.avatar}</div>
                    <div class="character-name">${character.getDisplayName()}</div>
                    <div class="character-meta">
                        ${character.type !== 'NPC' ? `<span class="character-profession">${character.profession}</span>` : ''}
                        <span class="character-level">等级 ${character.level}</span>
                    </div>
                    
                    <div class="hatch-status-bars">
                        <div class="hatch-bar-container">
                            <div class="hatch-bar-label">生命值</div>
                            <div class="hatch-health-bar">
                                <div class="hatch-health-fill" style="width: ${(character.currentHealth / character.maxHealth) * 100}%"></div>
                            </div>
                            <div class="hatch-bar-text">${Math.floor(character.currentHealth)}/${Math.floor(character.maxHealth)}</div>
                        </div>
                        <div class="hatch-bar-container">
                            <div class="hatch-bar-label">魔法值</div>
                            <div class="hatch-mana-bar">
                                <div class="hatch-mana-fill" style="width: ${(character.currentMana / character.maxMana) * 100}%"></div>
                            </div>
                            <div class="hatch-bar-text">${Math.floor(character.currentMana)}/${Math.floor(character.maxMana)}</div>
                        </div>
                        <div class="hatch-bar-container">
                            <div class="hatch-bar-label">经验值</div>
                            <div class="hatch-exp-bar">
                                <div class="hatch-exp-fill" style="width: ${(character.currentExp / character.maxExp) * 100}%"></div>
                            </div>
                            <div class="hatch-bar-text">${Math.floor(character.currentExp)}/${Math.floor(character.maxExp)}</div>
                        </div>
                    </div>
                    
                    <div class="character-attributes">
                        <div class="attr-item">💪 力量: ${character.attributes.strength}</div>
                        <div class="attr-item">👟 敏捷: ${character.attributes.agility}</div>
                        <div class="attr-item">🧠 智慧: ${character.attributes.intelligence}</div>
                        <div class="attr-item">🔧 技巧: ${character.attributes.skill}</div>
                        <div class="secondary-attributes">
                            <div class="secondary-title">副属性</div>
                            <div class="secondary-attributes-grid">
                                <div class="secondary-attr-card">
                                    <div class="attr-icon">⚔️</div>
                                    <div class="attr-label">攻击力</div>
                                    <div class="attr-value">${character.secondaryAttributes.attackPower}</div>
                                </div>
                                <div class="secondary-attr-card">
                                    <div class="attr-icon">🛡️</div>
                                    <div class="attr-label">防御力</div>
                                    <div class="attr-value">${character.secondaryAttributes.defense}</div>
                                </div>
                                <div class="secondary-attr-card">
                                    <div class="attr-icon">💨</div>
                                    <div class="attr-label">移动速度</div>
                                    <div class="attr-value">${character.secondaryAttributes.moveSpeed}</div>
                                </div>
                                <div class="secondary-attr-card">
                                    <div class="attr-icon">🩹</div>
                                    <div class="attr-label">生命恢复</div>
                                    <div class="attr-value">${character.secondaryAttributes.healthRegen.toFixed(1)}/秒</div>
                                </div>
                                <div class="secondary-attr-card">
                                    <div class="attr-icon">💙</div>
                                    <div class="attr-label">魔法恢复</div>
                                    <div class="attr-value">${character.secondaryAttributes.manaRegen.toFixed(1)}/秒</div>
                                </div>
                                <div class="secondary-attr-card">
                                    <div class="attr-icon">⚖️</div>
                                    <div class="attr-label">体重</div>
                                    <div class="attr-value">${character.secondaryAttributes.weight}kg</div>
                                </div>
                                <div class="secondary-attr-card">
                                    <div class="attr-icon">📦</div>
                                    <div class="attr-label">体积</div>
                                    <div class="attr-value">${character.secondaryAttributes.volume}L</div>
                                </div>
                                <div class="secondary-attr-card">
                                    <div class="attr-icon">⭐</div>
                                    <div class="attr-label">经验获取</div>
                                    <div class="attr-value">${character.secondaryAttributes.expGain}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="hatch-notice">角色已自动存入仓库</div>
                    <div class="egg-contribution">
                        <div class="contribution-title">🥚 蛋属性加成</div>
                        <div class="contribution-text">
                            强壮${this.hatchedEgg ? this.hatchedEgg.attributes.strength.current : 0} → 力量+${this.hatchedEgg ? this.hatchedEgg.attributes.strength.current : 0}<br>
                            活力${this.hatchedEgg ? this.hatchedEgg.attributes.vitality.current : 0} → 敏捷+${this.hatchedEgg ? this.hatchedEgg.attributes.vitality.current : 0}<br>
                            机灵${this.hatchedEgg ? this.hatchedEgg.attributes.cleverness.current : 0} → 智慧+${this.hatchedEgg ? this.hatchedEgg.attributes.cleverness.current : 0}<br>
                            悟性${this.hatchedEgg ? this.hatchedEgg.attributes.wisdom.current : 0} → 技巧+${this.hatchedEgg ? this.hatchedEgg.attributes.wisdom.current : 0}
                        </div>
                    </div>
                </div>
                <button class="close-modal-btn">确定</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 触发淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
        
        // 绑定关闭事件
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('fade-out');
                setTimeout(() => {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                }, 300);
            }
        });
        
        console.log('孵化出新角色:', character.getDisplayName(), '已存入仓库');
    }
    
    // 切换食物选择区域显示/隐藏
    toggleFeedingSection(egg) {
        const feedingSection = document.getElementById('feedingSection');
        const feedingFoodGrid = document.getElementById('feedingFoodGrid');
        
        if (!feedingSection || !feedingFoodGrid) {
            console.error('食物选择区域元素未找到');
            return;
        }
        
        if (feedingSection.style.display === 'none') {
            // 显示食物选择区域
            this.showFeedingSection(egg, feedingSection, feedingFoodGrid);
        } else {
            // 隐藏食物选择区域
            this.hideFeedingSection(feedingSection);
        }
    }
    
    // 显示食物选择区域
    showFeedingSection(egg, feedingSection, feedingFoodGrid) {
        // 检查蛋是否已满
        const isEggFull = egg.attributes.satiety.current >= egg.attributes.satiety.max;
        
        if (isEggFull) {
            feedingFoodGrid.innerHTML = '<div class="inline-no-food-message">🥚 蛋已饱腹，无需投喂<br>可以直接孵化了！</div>';
            feedingSection.style.display = 'block';
            console.log('蛋已饱腹，显示饱腹提示');
            return;
        }
        
        // 获取所有食物类型的物品
        const foodItems = this.inventory.filter(item => item.type === '食物');
        
        // 统计每种食物的数量
        const foodCounts = {};
        foodItems.forEach(food => {
            if (foodCounts[food.name]) {
                foodCounts[food.name].count++;
            } else {
                foodCounts[food.name] = {
                    item: food,
                    count: 1
                };
            }
        });
        
        // 生成食物选择内容
        feedingFoodGrid.innerHTML = Object.keys(foodCounts).length > 0 ? 
            Object.values(foodCounts).map(foodData => `
                <div class="inline-feeding-food-item" data-food-name="${foodData.item.name}">
                    <div class="inline-food-icon">${foodData.item.icon}</div>
                    <div class="inline-food-info">
                        <div class="inline-food-name ${foodData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${foodData.item.getRarityColor()}">${foodData.item.name}</div>
                        <div class="inline-food-effect">${foodData.item.effect}</div>
                        <div class="inline-food-count">拥有 ${foodData.count}</div>
                    </div>
                </div>
            `).join('') : 
            '<div class="inline-no-food-message">背包中没有食物<br>请先到商店购买食物</div>';
        
        // 显示区域
        feedingSection.style.display = 'block';
        
        // 只有在蛋未满时才绑定食物点击事件
        if (!isEggFull) {
            this.bindInlineFoodEvents(egg, feedingFoodGrid);
        }
        
        console.log('显示内联食物选择区域，可用食物:', Object.keys(foodCounts));
    }
    
    // 隐藏食物选择区域
    hideFeedingSection(feedingSection) {
        feedingSection.style.display = 'none';
        console.log('隐藏内联食物选择区域');
    }
    
    // 绑定内联食物事件
    bindInlineFoodEvents(egg, feedingFoodGrid) {
        const foodItems = feedingFoodGrid.querySelectorAll('.inline-feeding-food-item[data-food-name]');
        foodItems.forEach(foodElement => {
            foodElement.addEventListener('click', () => {
                const foodName = foodElement.dataset.foodName;
                const success = this.feedEggWithFood(egg, foodName);
                
                if (success) {
                    // 刷新食物选择区域内容
                    this.refreshInlineFeedingSection(egg);
                }
            });
        });
    }
    
    // 刷新内联食物选择区域
    refreshInlineFeedingSection(egg) {
        const feedingSection = document.getElementById('feedingSection');
        const feedingFoodGrid = document.getElementById('feedingFoodGrid');
        
        if (feedingSection && feedingSection.style.display !== 'none') {
            this.showFeedingSection(egg, feedingSection, feedingFoodGrid);
        }
    }
    
    // 显示投喂选择窗口（保留原方法以兼容其他调用）
    showFeedingModal(egg) {
        // 检查蛋是否已满
        const isEggFull = egg.attributes.satiety.current >= egg.attributes.satiety.max;
        
        // 获取所有食物类型的物品
        const foodItems = this.inventory.filter(item => item.type === '食物');
        
        // 统计每种食物的数量
        const foodCounts = {};
        foodItems.forEach(food => {
            if (foodCounts[food.name]) {
                foodCounts[food.name].count++;
            } else {
                foodCounts[food.name] = {
                    item: food,
                    count: 1
                };
            }
        });
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'feeding-modal';
        modal.innerHTML = `
            <div class="feeding-modal-content">
                <div class="feeding-modal-header">
                    <div class="feeding-modal-title">🍽️ 选择食物投喂</div>
                    <button class="close-feeding-btn">×</button>
                </div>
                
                <div class="feeding-food-list">
                    ${isEggFull ? 
                        '<div class="no-food-message">🥚 蛋已饱腹，无需投喂<br>可以直接孵化了！</div>' :
                        (Object.keys(foodCounts).length > 0 ? 
                            Object.values(foodCounts).map(foodData => `
                                <div class="feeding-food-item" data-food-name="${foodData.item.name}">
                                    <div class="feeding-food-icon">${foodData.item.icon}</div>
                                    <div class="feeding-food-name ${foodData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${foodData.item.getRarityColor()}">${foodData.item.name}</div>
                                    <div class="feeding-food-effect">${foodData.item.effect}</div>
                                    <div class="feeding-food-count">拥有 ${foodData.count}</div>
                                </div>
                            `).join('') : 
                            '<div class="no-food-message">背包中没有食物<br>请先到商店购买食物</div>'
                        )
                    }
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 触发淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
        
        // 绑定关闭事件
        modal.querySelector('.close-feeding-btn').addEventListener('click', () => {
            this.closeFeedingModal(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeFeedingModal(modal);
            }
        });
        
        // 只有在蛋未满时才绑定食物点击事件
        if (!isEggFull) {
            const foodItems_elements = modal.querySelectorAll('.feeding-food-item[data-food-name]');
            foodItems_elements.forEach(foodElement => {
                foodElement.addEventListener('click', () => {
                    const foodName = foodElement.dataset.foodName;
                    this.feedEggWithFood(egg, foodName);
                    // 不关闭窗口，让用户可以继续投喂
                    // 刷新窗口内容以更新食物数量
                    this.refreshFeedingModal(modal, egg);
                });
            });
        }
        
        console.log('显示投喂选择窗口，蛋饱腹状态:', isEggFull, '可用食物:', Object.keys(foodCounts));
    }
    
    // 刷新投喂选择窗口内容
    refreshFeedingModal(modal, egg) {
        // 检查蛋是否已满
        const isEggFull = egg.attributes.satiety.current >= egg.attributes.satiety.max;
        
        // 获取所有食物类型的物品
        const foodItems = this.inventory.filter(item => item.type === '食物');
        
        // 统计每种食物的数量
        const foodCounts = {};
        foodItems.forEach(food => {
            if (foodCounts[food.name]) {
                foodCounts[food.name].count++;
            } else {
                foodCounts[food.name] = {
                    item: food,
                    count: 1
                };
            }
        });
        
        // 更新食物列表内容
        const foodList = modal.querySelector('.feeding-food-list');
        foodList.innerHTML = isEggFull ? 
            '<div class="no-food-message">🥚 蛋已饱腹，无需投喂<br>可以直接孵化了！</div>' :
            (Object.keys(foodCounts).length > 0 ? 
                Object.values(foodCounts).map(foodData => `
                    <div class="feeding-food-item" data-food-name="${foodData.item.name}">
                        <div class="feeding-food-icon">${foodData.item.icon}</div>
                        <div class="feeding-food-name ${foodData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${foodData.item.getRarityColor()}">${foodData.item.name}</div>
                        <div class="feeding-food-effect">${foodData.item.effect}</div>
                        <div class="feeding-food-count">拥有 ${foodData.count}</div>
                    </div>
                `).join('') : 
                '<div class="no-food-message">背包中没有食物<br>请先到商店购买食物</div>'
            );
        
        // 只有在蛋未满时才重新绑定食物点击事件
        if (!isEggFull) {
            const foodItems_elements = modal.querySelectorAll('.feeding-food-item[data-food-name]');
            foodItems_elements.forEach(foodElement => {
                foodElement.addEventListener('click', () => {
                    const foodName = foodElement.dataset.foodName;
                    this.feedEggWithFood(egg, foodName);
                    // 递归刷新窗口内容
                    this.refreshFeedingModal(modal, egg);
                });
            });
        }
        
        console.log('刷新投喂窗口，蛋饱腹状态:', isEggFull, '可用食物:', Object.keys(foodCounts));
    }
    
    // 关闭投喂选择窗口
    closeFeedingModal(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    // 使用食物投喂蛋
    feedEggWithFood(egg, foodName) {
        // 确保蛋对象有feedWithFood方法
        if (!egg.feedWithFood) {
            console.log('蛋对象缺少feedWithFood方法，正在添加...');
            egg.feedWithFood = function(foodItem) {
                if (foodItem.type !== '食物') {
                    return false;
                }
                
                // 检查饱腹度是否已满
                if (this.attributes.satiety.current >= this.attributes.satiety.max) {
                    return false;
                }
                
                // 根据食物类型应用不同效果
                switch(foodItem.name) {
                    case '米饭':
                        this.attributes.satiety.current = Math.min(
                            this.attributes.satiety.current + 15,
                            this.attributes.satiety.max
                        );
                        break;
                    case '牛奶':
                        this.attributes.satiety.current = Math.min(
                            this.attributes.satiety.current + 5,
                            this.attributes.satiety.max
                        );
                        if (this.attributes.strength) {
                            this.attributes.strength.current = Math.min(
                                this.attributes.strength.current + 1,
                                this.attributes.strength.max
                            );
                        }
                        break;
                    case '番茄':
                        this.attributes.satiety.current = Math.min(
                            this.attributes.satiety.current + 5,
                            this.attributes.satiety.max
                        );
                        if (this.attributes.vitality) {
                            this.attributes.vitality.current = Math.min(
                                this.attributes.vitality.current + 1,
                                this.attributes.vitality.max
                            );
                        }
                        break;
                    case '鸡腿':
                        this.attributes.satiety.current = Math.min(
                            this.attributes.satiety.current + 5,
                            this.attributes.satiety.max
                        );
                        if (this.attributes.cleverness) {
                            this.attributes.cleverness.current = Math.min(
                                this.attributes.cleverness.current + 1,
                                this.attributes.cleverness.max
                            );
                        }
                        break;
                    case '肉排':
                        this.attributes.satiety.current = Math.min(
                            this.attributes.satiety.current + 10,
                            this.attributes.satiety.max
                        );
                        if (this.attributes.wisdom) {
                            this.attributes.wisdom.current = Math.min(
                                this.attributes.wisdom.current + 1,
                                this.attributes.wisdom.max
                            );
                        }
                        break;
                    default:
                        // 未知食物，只增加饱腹度
                        this.attributes.satiety.current = Math.min(
                            this.attributes.satiety.current + 5,
                            this.attributes.satiety.max
                        );
                }
                
                return true;
            };
        }
        
        // 检查蛋是否已满
        if (egg.attributes.satiety.current >= egg.attributes.satiety.max) {
            console.log('蛋已饱腹，无法投喂');
            return false;
        }
        
        // 找到对应的食物物品
        const foodIndex = this.inventory.findIndex(item => 
            item.type === '食物' && item.name === foodName
        );
        
        if (foodIndex === -1) {
            console.log('没有找到食物:', foodName);
            return false;
        }
        
        const foodItem = this.inventory[foodIndex];
        
        // 投喂蛋
        const success = egg.feedWithFood(foodItem);
        
        if (success) {
            // 从背包中移除使用的食物
            this.inventory.splice(foodIndex, 1);
            
            // 检查当前食物页面是否还有效，如果没有食物了就重置到第一页
            const remainingFoods = this.inventory.filter(item => item.type === '食物');
            const uniqueFoodCount = new Set(remainingFoods.map(food => food.name)).size;
            const foodsPerPage = 8;
            const maxPage = Math.max(0, Math.ceil(uniqueFoodCount / foodsPerPage) - 1);
            if (this.currentFoodPage > maxPage) {
                this.currentFoodPage = maxPage;
            }
            
            // 如果当前在孵化师界面，刷新UI
            if (this.currentCharacter && this.currentCharacter.name === '孵化师') {
                // 保存当前滚动位置
                const controlContent = document.querySelector('.control-content');
                const scrollTop = controlContent ? controlContent.scrollTop : 0;
                
                this.initCharacterPanel();
                
                // 恢复滚动位置
                if (controlContent) {
                    controlContent.scrollTop = scrollTop;
                }
            }
            
            console.log(`使用 ${foodName} 投喂蛋成功`);
            return true;
        } else {
            console.log(`投喂失败: ${foodName} - 蛋可能已饱腹`);
            return false;
        }
    }
    
    // 创建烟花效果
    createFireworks() {
        const fireworks = [];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        
        // 创建多个烟花
        for (let i = 0; i < 6; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const delay = Math.random() * 2; // 随机延迟
            const x = 10 + Math.random() * 80; // 随机水平位置 (10%-90%)
            const y = 10 + Math.random() * 60; // 随机垂直位置 (10%-70%)
            
            fireworks.push(`
                <div class="firework" style="
                    left: ${x}%; 
                    top: ${y}%; 
                    animation-delay: ${delay}s;
                    --firework-color: ${color};
                ">
                    ${this.createFireworkParticles()}
                </div>
            `);
        }
        
        return fireworks.join('');
    }
    
    // 创建烟花粒子
    createFireworkParticles() {
        const particles = [];
        
        // 创建8个方向的粒子
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * (Math.PI / 180); // 转换为弧度
            particles.push(`
                <div class="firework-particle" style="
                    --angle: ${angle}rad;
                    --distance: ${30 + Math.random() * 20}px;
                "></div>
            `);
        }
        
        return particles.join('');
    }
    
    // 绑定翻页事件
    bindPaginationEvents(container) {
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');
        const pageDots = container.querySelectorAll('.page-dot');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentEggPage > 0) {
                    this.currentEggPage--;
                    this.currentFoodPage = 0; // 重置食物页面
                    this.initCharacterPanel();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const eggs = this.inventory.filter(item => item.type === '蛋');
                const totalPages = Math.ceil(eggs.length / 1);
                if (this.currentEggPage < totalPages - 1) {
                    this.currentEggPage++;
                    this.currentFoodPage = 0; // 重置食物页面
                    this.initCharacterPanel();
                }
            });
        }
        
        pageDots.forEach(dot => {
            dot.addEventListener('click', () => {
                this.currentEggPage = parseInt(dot.dataset.page);
                this.currentFoodPage = 0; // 重置食物页面
                this.initCharacterPanel();
            });
        });
    }
    
    // 显示丢弃确认弹窗
    showDiscardConfirmation(egg) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'discard-modal';
        modal.innerHTML = `
            <div class="discard-modal-content">
                <div class="discard-title">⚠️ 确认丢弃</div>
                <div class="discard-egg-info">
                    <div class="egg-preview">
                        <div class="egg-icon-large">${egg.icon}</div>
                        <div class="egg-name-preview">${egg.name}</div>
                        <div class="egg-description-preview">${egg.description}</div>
                    </div>
                    <div class="discard-warning">
                        你确定要丢弃这个蛋吗？<br>
                        <span class="warning-text">此操作无法撤销！</span>
                    </div>
                </div>
                <div class="discard-actions">
                    <button class="discard-confirm-btn">确认丢弃</button>
                    <button class="discard-cancel-btn">取消</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定确认按钮事件
        modal.querySelector('.discard-confirm-btn').addEventListener('click', () => {
            this.discardEgg(egg);
            document.body.removeChild(modal);
        });
        
        // 绑定取消按钮事件
        modal.querySelector('.discard-cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // 点击背景关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // 丢弃蛋
    discardEgg(egg) {
        // 从背包中移除这个特定的蛋
        const eggIndex = this.inventory.indexOf(egg);
        if (eggIndex > -1) {
            this.inventory.splice(eggIndex, 1);
            console.log('丢弃了蛋:', egg.name);
        }
        
        // 调整当前页面索引
        const eggs = this.inventory.filter(item => item.type === '蛋');
        if (this.currentEggPage >= eggs.length && this.currentEggPage > 0) {
            this.currentEggPage--;
        }
        
        // 刷新UI
        this.initCharacterPanel();
    }
    
    // 创建角色管理员UI
    createCharacterManagerUI(container, character) {
        const itemsPerPage = 6;
        const characters = this.characters;
        const totalCharacterPages = Math.max(1, Math.ceil(characters.length / itemsPerPage));
        
        // 初始化角色管理页面
        if (this.characterManagerPage === undefined) {
            this.characterManagerPage = 0;
        }
        
        container.innerHTML = `
            <div class="character-manager-section">
                <div class="section-title">角色仓库</div>
                
                <div class="warehouse-content">
                    ${this.createCharactersTabContent(characters, itemsPerPage, totalCharacterPages)}
                </div>
                
                <div class="character-manager-actions">
                    <button class="dismiss-character-btn" style="
                        margin-top: 15px;
                        padding: 10px 20px;
                        background: #f44336;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: background 0.3s;
                    ">🚫 驱逐角色</button>
                </div>
            </div>
        `;
        
        // 绑定角色管理事件
        this.bindCharacterManagerEvents(container);
    }
    
    // 绑定角色管理事件
    bindCharacterManagerEvents(container) {
        // 驱逐角色按钮事件
        const dismissBtn = container.querySelector('.dismiss-character-btn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.showDismissCharacterSelection();
            });
        }
        
        // 分页按钮事件 - 支持新格式按钮
        const prevButton = container.querySelector('.page-btn.prev-btn[data-type="characters"]');
        const nextButton = container.querySelector('.page-btn.next-btn[data-type="characters"]');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (this.characterManagerPage > 0) {
                    this.characterManagerPage--;
                    // 保存滚动位置
                    const controlContent = document.querySelector('.control-content');
                    const scrollTop = controlContent ? controlContent.scrollTop : 0;
                    // 刷新界面
                    this.initCharacterPanel();
                    // 恢复滚动位置
                    if (controlContent) {
                        setTimeout(() => {
                            controlContent.scrollTop = scrollTop;
                        }, 0);
                    }
                }
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const totalPages = Math.max(1, Math.ceil(this.characters.length / 6));
                if (this.characterManagerPage < totalPages - 1) {
                    this.characterManagerPage++;
                    // 保存滚动位置
                    const controlContent = document.querySelector('.control-content');
                    const scrollTop = controlContent ? controlContent.scrollTop : 0;
                    // 刷新界面
                    this.initCharacterPanel();
                    // 恢复滚动位置
                    if (controlContent) {
                        setTimeout(() => {
                            controlContent.scrollTop = scrollTop;
                        }, 0);
                    }
                }
            });
        }
        
        // 圆点分页事件
        const pageDots = container.querySelectorAll('.page-dot[data-type="characters"]');
        pageDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const page = parseInt(dot.dataset.page);
                this.characterManagerPage = page;
                // 保存滚动位置
                const controlContent = document.querySelector('.control-content');
                const scrollTop = controlContent ? controlContent.scrollTop : 0;
                // 刷新界面
                this.initCharacterPanel();
                // 恢复滚动位置
                if (controlContent) {
                    setTimeout(() => {
                        controlContent.scrollTop = scrollTop;
                    }, 0);
                }
            });
        });
        
        // 角色卡片点击事件（替代详情按钮）
        const characterCards = container.querySelectorAll('.warehouse-character[data-character-index]');
        characterCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const characterIndex = parseInt(e.currentTarget.dataset.characterIndex);
                const character = this.characters[characterIndex];
                if (character) {
                    this.showCharacterDetail(character);
                }
            });
        });
    }
    
    // 创建仓库UI
    createWarehouseUI(container, character) {
        const itemsPerPage = 6;
        const foods = this.inventory.filter(item => item.type === '食物'); // 食物类型物品
        const eggs = this.inventory.filter(item => item.type === '蛋'); // 只包含蛋类物品
        const materials = this.inventory.filter(item => item.type === '材料'); // 只包含材料类型物品
        const consumables = this.inventory.filter(item => item.type === '消耗品'); // 只包含消耗品物品
        const equipment = this.inventory.filter(item => item.type === '装备'); // 只包含装备物品
        const books = this.inventory.filter(item => item.type === '书'); // 只包含书类物品
        
        const totalFoodPages = Math.max(1, Math.ceil(this.getUniqueItemsCount(foods) / itemsPerPage));
        const totalEggPages = Math.max(1, Math.ceil(eggs.length / itemsPerPage));
        const totalMaterialPages = Math.max(1, Math.ceil(this.getUniqueItemsCount(materials) / itemsPerPage));
        const totalConsumablePages = Math.max(1, Math.ceil(this.getUniqueItemsCount(consumables) / itemsPerPage));
        const totalEquipmentPages = Math.max(1, Math.ceil(equipment.length / itemsPerPage));
        const totalBookPages = Math.max(1, Math.ceil(this.getUniqueItemsCount(books) / itemsPerPage));
        
        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="warehouse-section">
                <div class="section-title">仓库管理</div>
                
                <div class="warehouse-tabs">
                    <button class="warehouse-tab ${this.warehouseTab === 'foods' ? 'active' : ''}" data-tab="foods">
                        食物 (${this.getUniqueItemsCount(foods)})
                    </button>
                    <button class="warehouse-tab ${this.warehouseTab === 'eggs' ? 'active' : ''}" data-tab="eggs">
                        蛋 (${eggs.length})
                    </button>
                    <button class="warehouse-tab ${this.warehouseTab === 'materials' ? 'active' : ''}" data-tab="materials">
                        材料 (${this.getUniqueItemsCount(materials)})
                    </button>
                    <button class="warehouse-tab ${this.warehouseTab === 'consumables' ? 'active' : ''}" data-tab="consumables">
                        消耗品 (${this.getUniqueItemsCount(consumables)})
                    </button>
                    <button class="warehouse-tab ${this.warehouseTab === 'equipment' ? 'active' : ''}" data-tab="equipment">
                        装备 (${equipment.length})
                    </button>
                    <button class="warehouse-tab ${this.warehouseTab === 'books' ? 'active' : ''}" data-tab="books">
                        书 (${this.getUniqueItemsCount(books)})
                    </button>
                </div>
                
                <div class="warehouse-content">
                    ${this.warehouseTab === 'foods' ? this.createFoodsTabContent(foods, itemsPerPage, totalFoodPages) : ''}
                    ${this.warehouseTab === 'eggs' ? this.createEggsTabContent(eggs, itemsPerPage, totalEggPages) : ''}
                    ${this.warehouseTab === 'materials' ? this.createMaterialsTabContent(materials, itemsPerPage, totalMaterialPages) : ''}
                    ${this.warehouseTab === 'consumables' ? this.createConsumablesTabContent(consumables, itemsPerPage, totalConsumablePages) : ''}
                    ${this.warehouseTab === 'equipment' ? this.createEquipmentTabContent(equipment, itemsPerPage, totalEquipmentPages) : ''}
                    ${this.warehouseTab === 'books' ? this.createBooksTabContent(books, itemsPerPage, totalBookPages) : ''}
                </div>
            </div>
        `;
        
        // 绑定事件
        this.bindWarehouseEvents(container);
    }
    
    // 获取唯一物品数量（食物类物品叠加计算）
    getUniqueItemsCount(items) {
        const uniqueItems = {};
        items.forEach(item => {
            if (uniqueItems[item.name]) {
                uniqueItems[item.name]++;
            } else {
                uniqueItems[item.name] = 1;
            }
        });
        return Object.keys(uniqueItems).length;
    }
    
    // 判断物品是否可以使用
    canUseItem(item) {
        // 技能书类型的书可以使用
        if (item.type === '书' && item.skillId) {
            return true;
        }
        // 其他消耗品（如绷带、魔力胶囊）也可以使用
        if (item.type === '消耗品') {
            return true;
        }
        return false;
    }
    
    // 创建食物标签页内容
    createFoodsTabContent(foods, itemsPerPage, totalPages) {
        // 将食物按名称分组并计数
        const groupedFoods = {};
        foods.forEach(food => {
            if (groupedFoods[food.name]) {
                groupedFoods[food.name].count++;
                groupedFoods[food.name].items.push(food);
            } else {
                groupedFoods[food.name] = {
                    item: food,
                    count: 1,
                    items: [food]
                };
            }
        });
        
        const uniqueFoods = Object.values(groupedFoods);
        const startIndex = this.warehouseFoodPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, uniqueFoods.length);
        const pageFoods = uniqueFoods.slice(startIndex, endIndex);
        
        return `
            <div class="warehouse-header">
                <span class="warehouse-count">食物列表</span>
                <div class="warehouse-pagination">
                    <button class="prev-page" ${this.warehouseFoodPage === 0 ? 'disabled' : ''}>上一页</button>
                    <span class="page-info">${this.warehouseFoodPage + 1} / ${totalPages}</span>
                    <button class="next-page" ${this.warehouseFoodPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
                </div>
            </div>
            <div class="warehouse-grid">
                ${pageFoods.length > 0 ? pageFoods.map((foodData, index) => {
                    // 确保食物对象有getRarityColor方法
                    if (!foodData.item.getRarityColor || typeof foodData.item.getRarityColor !== 'function') {
                        foodData.item.getRarityColor = function() {
                            const colors = {
                                '普通': '#FFFFFF',
                                '稀有': '#4A90E2',
                                '神话': '#9B59B6',
                                '传说': '#E67E22',
                                '特殊': '#27AE60'
                            };
                            return colors[this.rarity] || '#FFFFFF';
                        };
                    }
                    return `
                    <div class="warehouse-item food-item-card" data-item-name="${foodData.item.name}" data-item-index="${startIndex + index}" data-item-count="${foodData.count}">
                        <div class="item-icon">${foodData.item.icon}</div>
                        <div class="item-name ${foodData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${foodData.item.getRarityColor()}">${foodData.item.name}</div>
                        <div class="item-description">${foodData.item.description}</div>
                        <div class="item-type">${foodData.item.type} ${foodData.count > 1 ? `×${foodData.count}` : ''}</div>
                        ${this.canUseItem(foodData.item) ? `
                            <div class="item-actions">
                                <button class="use-item-button" data-item-name="${foodData.item.name}">使用</button>
                            </div>
                        ` : ''}
                    </div>
                `;}).join('') : '<div class="empty-message">暂无食物</div>'}
            </div>
        `;
    }
    
    // 创建材料标签页内容
    createMaterialsTabContent(materials, itemsPerPage, totalPages) {
        // 将材料按名称分组并计数
        const groupedMaterials = {};
        materials.forEach(material => {
            if (groupedMaterials[material.name]) {
                groupedMaterials[material.name].count++;
                groupedMaterials[material.name].items.push(material);
            } else {
                groupedMaterials[material.name] = {
                    item: material,
                    count: 1,
                    items: [material]
                };
            }
        });
        
        const uniqueMaterials = Object.values(groupedMaterials);
        const startIndex = this.warehouseMaterialPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, uniqueMaterials.length);
        const pageMaterials = uniqueMaterials.slice(startIndex, endIndex);
        
        return `
            <div class="warehouse-header">
                <span class="warehouse-count">材料列表</span>
                <div class="warehouse-pagination">
                    <button class="prev-page" ${this.warehouseMaterialPage === 0 ? 'disabled' : ''}>上一页</button>
                    <span class="page-info">${this.warehouseMaterialPage + 1} / ${totalPages}</span>
                    <button class="next-page" ${this.warehouseMaterialPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
                </div>
            </div>
            <div class="warehouse-grid">
                ${pageMaterials.length > 0 ? pageMaterials.map((materialData, index) => {
                    // 确保材料对象有getRarityColor方法
                    if (!materialData.item.getRarityColor || typeof materialData.item.getRarityColor !== 'function') {
                        materialData.item.getRarityColor = function() {
                            const colors = {
                                '普通': '#FFFFFF',
                                '稀有': '#4A90E2',
                                '神话': '#9B59B6',
                                '传说': '#E67E22',
                                '特殊': '#27AE60'
                            };
                            return colors[this.rarity] || '#FFFFFF';
                        };
                    }
                    return `
                    <div class="warehouse-item" data-item-name="${materialData.item.name}" data-item-index="${startIndex + index}">
                        <div class="item-icon">${materialData.item.icon}</div>
                        <div class="item-name ${materialData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${materialData.item.getRarityColor()}">${materialData.item.name}</div>
                        <div class="item-description">${materialData.item.description}</div>
                        <div class="item-type">${materialData.item.type} ${materialData.count > 1 ? `×${materialData.count}` : ''}</div>
                        ${this.canUseItem(materialData.item) ? `
                            <div class="item-actions">
                                <button class="use-item-button" data-item-name="${materialData.item.name}">使用</button>
                            </div>
                        ` : ''}
                    </div>
                `;}).join('') : '<div class="empty-message">暂无材料</div>'}
            </div>
        `;
    }
    
    // 创建消耗品标签页内容
    createConsumablesTabContent(consumables, itemsPerPage, totalPages) {
        // 将消耗品按名称分组并计数
        const groupedConsumables = {};
        consumables.forEach(consumable => {
            if (groupedConsumables[consumable.name]) {
                groupedConsumables[consumable.name].count++;
                groupedConsumables[consumable.name].items.push(consumable);
            } else {
                groupedConsumables[consumable.name] = {
                    item: consumable,
                    count: 1,
                    items: [consumable]
                };
            }
        });
        
        const uniqueConsumables = Object.values(groupedConsumables);
        const startIndex = this.warehouseConsumablePage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, uniqueConsumables.length);
        const pageConsumables = uniqueConsumables.slice(startIndex, endIndex);
        
        return `
            <div class="warehouse-header">
                <span class="warehouse-count">消耗品列表</span>
                <div class="warehouse-pagination">
                    <button class="prev-page" ${this.warehouseConsumablePage === 0 ? 'disabled' : ''}>上一页</button>
                    <span class="page-info">${this.warehouseConsumablePage + 1} / ${totalPages}</span>
                    <button class="next-page" ${this.warehouseConsumablePage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
                </div>
            </div>
            <div class="warehouse-grid">
                ${pageConsumables.length > 0 ? pageConsumables.map((consumableData, index) => {
                    // 确保消耗品对象有getRarityColor方法
                    if (!consumableData.item.getRarityColor || typeof consumableData.item.getRarityColor !== 'function') {
                        consumableData.item.getRarityColor = function() {
                            const colors = {
                                '普通': '#FFFFFF',
                                '稀有': '#4A90E2',
                                '神话': '#9B59B6',
                                '传说': '#E67E22',
                                '特殊': '#27AE60'
                            };
                            return colors[this.rarity] || '#FFFFFF';
                        };
                    }
                    
                    return `
                        <div class="warehouse-item consumable-item-clickable" data-item-name="${consumableData.item.name}" data-item-index="${startIndex + index}">
                            <div class="item-icon">${consumableData.item.icon}</div>
                            <div class="item-name ${consumableData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${consumableData.item.getRarityColor()}">${consumableData.item.name}</div>
                            <div class="item-description">${consumableData.item.description}</div>
                            <div class="item-type">${consumableData.item.type} ${consumableData.count > 1 ? `×${consumableData.count}` : ''}</div>
                        </div>
                    `;
                }).join('') : '<div class="empty-message">暂无消耗品</div>'}
            </div>
        `;
    }
    
    // 创建物品标签页内容（食物叠加显示）
    createItemsTabContent(items, itemsPerPage, totalPages) {
        // 将物品按名称分组并计数
        const groupedItems = {};
        items.forEach(item => {
            if (groupedItems[item.name]) {
                groupedItems[item.name].count++;
                groupedItems[item.name].items.push(item);
            } else {
                groupedItems[item.name] = {
                    item: item,
                    count: 1,
                    items: [item]
                };
            }
        });
        
        const uniqueItems = Object.values(groupedItems);
        const startIndex = this.warehouseItemPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, uniqueItems.length);
        const pageItems = uniqueItems.slice(startIndex, endIndex);
        
        return `
            <div class="warehouse-header">
                <span class="warehouse-count">物品列表</span>
                ${totalPages > 1 ? `
                    <div class="warehouse-pagination">
                        <button class="page-btn prev-btn" data-type="items" ${this.warehouseItemPage === 0 ? 'disabled' : ''}>‹</button>
                        <div class="page-dots">
                            ${Array.from({length: totalPages}, (_, i) => 
                                `<span class="page-dot ${i === this.warehouseItemPage ? 'active' : ''}" data-page="${i}" data-type="items"></span>`
                            ).join('')}
                        </div>
                        <button class="page-btn next-btn" data-type="items" ${this.warehouseItemPage >= totalPages - 1 ? 'disabled' : ''}>›</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="warehouse-grid">
                ${pageItems.length > 0 ? pageItems.map((itemData, index) => `
                    <div class="warehouse-item" data-item-name="${itemData.item.name}" data-item-index="${startIndex + index}">
                        <div class="item-icon">${itemData.item.icon}</div>
                        <div class="item-name ${itemData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${itemData.item.getRarityColor()}">${itemData.item.name}</div>
                        <div class="item-description">${itemData.item.description}</div>
                        <div class="item-type">${itemData.item.type}</div>
                        ${itemData.count > 1 ? `<div class="item-count">数量: ${itemData.count}</div>` : ''}
                        ${this.canUseItem(itemData.item) ? `
                            <div class="item-actions">
                                <button class="item-btn use-btn" data-item-name="${itemData.item.name}">使用</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('') : '<div class="empty-warehouse">仓库中没有物品</div>'}
            </div>
        `;
    }
    
    // 创建蛋标签页内容
    createEggsTabContent(eggs, itemsPerPage, totalPages) {
        const startIndex = this.warehouseEggPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, eggs.length);
        const pageEggs = eggs.slice(startIndex, endIndex);
        
        return `
            <div class="warehouse-header">
                <span class="warehouse-count">蛋列表</span>
                ${totalPages > 1 ? `
                    <div class="warehouse-pagination">
                        <button class="page-btn prev-btn" data-type="eggs" ${this.warehouseEggPage === 0 ? 'disabled' : ''}>‹</button>
                        <div class="page-dots">
                            ${Array.from({length: totalPages}, (_, i) => 
                                `<span class="page-dot ${i === this.warehouseEggPage ? 'active' : ''}" data-page="${i}" data-type="eggs"></span>`
                            ).join('')}
                        </div>
                        <button class="page-btn next-btn" data-type="eggs" ${this.warehouseEggPage >= totalPages - 1 ? 'disabled' : ''}>›</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="warehouse-grid">
                ${pageEggs.length > 0 ? pageEggs.map((egg, index) => {
                    // 安全检查：确保蛋对象有完整的attributes结构
                    if (!egg.attributes) {
                        egg.attributes = {
                            satiety: { current: 0, max: 100 },
                            strength: { current: 0, max: 10 },
                            vitality: { current: 0, max: 10 },
                            wisdom: { current: 0, max: 10 },
                            cleverness: { current: 0, max: 10 }
                        };
                    }
                    if (!egg.attributes.satiety) {
                        egg.attributes.satiety = { current: 0, max: 100 };
                    }
                    if (typeof egg.attributes.satiety.current === 'undefined') {
                        egg.attributes.satiety.current = 0;
                    }
                    if (typeof egg.attributes.satiety.max === 'undefined') {
                        egg.attributes.satiety.max = 100;
                    }
                    
                    // 确保canHatch方法存在
                    if (!egg.canHatch) {
                        egg.canHatch = function() {
                            return this.attributes && this.attributes.satiety && 
                                   this.attributes.satiety.current >= this.attributes.satiety.max;
                        };
                    }
                    
                    // 确保getRarityColor方法存在
                    if (!egg.getRarityColor) {
                        egg.getRarityColor = function() {
                            const colors = {
                                '普通': '#FFFFFF',
                                '稀有': '#4A90E2',
                                '神话': '#9B59B6',
                                '传说': '#E67E22',
                                '特殊': '#27AE60'
                            };
                            return colors[this.rarity] || '#FFFFFF';
                        };
                    }
                    
                    return `
                        <div class="warehouse-egg" data-egg-index="${startIndex + index}">
                            <div class="item-icon">${egg.icon}</div>
                            <div class="item-name ${egg.rarity === '普通' ? 'common-rarity' : ''}" style="color: ${egg.getRarityColor()}">${egg.name}</div>
                            <div class="item-description">${egg.description}</div>
                            <div class="egg-satiety">饱腹: ${egg.attributes.satiety.current}/${egg.attributes.satiety.max}</div>
                            <div class="egg-status">${egg.canHatch() ? '可孵化' : '未就绪'}</div>
                        </div>
                    `;
                }).join('') : '<div class="empty-warehouse">仓库中没有蛋</div>'}
            </div>
        `;
    }
    
    // 创建书类标签页内容
    createBooksTabContent(books, itemsPerPage, totalPages) {
        // 将书类物品按名称分组并计数
        const groupedBooks = {};
        books.forEach(item => {
            if (groupedBooks[item.name]) {
                groupedBooks[item.name].count++;
                groupedBooks[item.name].items.push(item);
            } else {
                groupedBooks[item.name] = {
                    item: item,
                    count: 1,
                    items: [item]
                };
            }
        });
        
        const uniqueBooks = Object.values(groupedBooks);
        const startIndex = this.warehouseBookPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, uniqueBooks.length);
        const pageBooks = uniqueBooks.slice(startIndex, endIndex);
        
        return `
            <div class="warehouse-header">
                <span class="warehouse-count">书籍列表</span>
                ${totalPages > 1 ? `
                    <div class="warehouse-pagination">
                        <button class="page-btn prev-btn" data-type="books" ${this.warehouseBookPage === 0 ? 'disabled' : ''}>‹</button>
                        <div class="page-dots">
                            ${Array.from({length: totalPages}, (_, i) => 
                                `<span class="page-dot ${i === this.warehouseBookPage ? 'active' : ''}" data-page="${i}" data-type="books"></span>`
                            ).join('')}
                        </div>
                        <button class="page-btn next-btn" data-type="books" ${this.warehouseBookPage >= totalPages - 1 ? 'disabled' : ''}>›</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="warehouse-grid">
                ${pageBooks.length > 0 ? pageBooks.map((bookData, index) => `
                    <div class="warehouse-item" data-item-name="${bookData.item.name}" data-item-index="${startIndex + index}">
                        <div class="item-icon">${bookData.item.icon}</div>
                        <div class="item-name ${bookData.item.rarity === '普通' ? 'common-rarity' : ''}" style="color: white; text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8), -1px -1px 1px rgba(0, 0, 0, 0.8), 1px -1px 1px rgba(0, 0, 0, 0.8), -1px 1px 1px rgba(0, 0, 0, 0.8);">${bookData.item.name}</div>
                        <div class="item-description" style="color: white; text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8), -1px -1px 1px rgba(0, 0, 0, 0.8), 1px -1px 1px rgba(0, 0, 0, 0.8), -1px 1px 1px rgba(0, 0, 0, 0.8);">${bookData.item.description}</div>
                        <div class="item-type" style="color: white; text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8), -1px -1px 1px rgba(0, 0, 0, 0.8), 1px -1px 1px rgba(0, 0, 0, 0.8), -1px 1px 1px rgba(0, 0, 0, 0.8);">${bookData.item.type} ${bookData.count > 1 ? `×${bookData.count}` : ''}</div>
                    </div>
                `).join('') : '<div class="empty-warehouse">仓库中没有书籍</div>'}
            </div>
        `;
    }
    
    // 创建装备标签页内容
    createEquipmentTabContent(equipment, itemsPerPage, totalPages) {
        const startIndex = this.warehouseEquipmentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, equipment.length);
        const pageEquipment = equipment.slice(startIndex, endIndex);
        
        return `
            <div class="warehouse-header">
                <span class="warehouse-count">装备列表</span>
                ${totalPages > 1 ? `
                    <div class="warehouse-pagination">
                        <button class="prev-page" ${this.warehouseEquipmentPage === 0 ? 'disabled' : ''}>上一页</button>
                        <span class="page-info">${this.warehouseEquipmentPage + 1} / ${totalPages}</span>
                        <button class="next-page" ${this.warehouseEquipmentPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="warehouse-grid">
                ${pageEquipment.length > 0 ? pageEquipment.map((item, index) => `
                    <div class="warehouse-equipment" data-equipment-index="${startIndex + index}" onclick="game.showEquipmentDetail(${startIndex + index})">
                        <div class="equipment-header">
                            <div class="item-icon">${item.icon}</div>
                            <div class="equipment-title-info">
                                <div class="item-name" style="color: ${item.getRarityColor()}">${item.name}</div>
                                <div class="equipment-type-rarity">${item.equipmentType} • ${item.rarity}</div>
                            </div>
                        </div>
                        <div class="equipment-main-affix">${item.mainAffix}</div>
                        <div class="equipment-sub-affixes">
                            ${item.subAffixes.length > 0 ? 
                                item.subAffixes.map(affix => 
                                    `<div class="sub-affix-detail rarity-${affix.rarity.toLowerCase()}" style="color: ${this.getAffixRarityColor(affix.rarity)}">${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value} ${this.getAffixValueRange(affix.name, affix.rarity)}</div>`
                                ).join('') 
                                : '<div class="no-sub-affixes">无副词条</div>'
                            }
                        </div>
                    </div>
                `).join('') : '<div class="empty-warehouse">仓库中没有装备</div>'}
            </div>
        `;
    }
    
    // 创建角色标签页内容
    createCharactersTabContent(characters, itemsPerPage, totalPages) {
        // 根据当前上下文决定使用哪个页面变量
        const currentPage = this.currentCharacter && this.currentCharacter.name === '角色管理员' 
            ? this.characterManagerPage 
            : this.warehouseCharacterPage;
        
        const startIndex = currentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, characters.length);
        const pageCharacters = characters.slice(startIndex, endIndex);
        
        return `
            <div class="warehouse-header">
                <span class="warehouse-count">角色列表</span>
                ${totalPages > 1 ? `
                    <div class="warehouse-pagination">
                        <button class="page-btn prev-btn" data-type="characters" ${currentPage === 0 ? 'disabled' : ''}>‹</button>
                        <div class="page-dots">
                            ${Array.from({length: totalPages}, (_, i) => 
                                `<span class="page-dot ${i === currentPage ? 'active' : ''}" data-page="${i}" data-type="characters"></span>`
                            ).join('')}
                        </div>
                        <button class="page-btn next-btn" data-type="characters" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>›</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="warehouse-grid">
                ${pageCharacters.length > 0 ? pageCharacters.map((char, index) => {
                    const isDead = char.isDead || char.currentHealth <= 0;
                    const statusClass = isDead ? 'dead' : 'alive';
                    const reviveText = char.isDead && char.reviveCountdown > 0 ? 
                        `<div class="revive-countdown">复活倒计时: ${Math.floor(char.reviveCountdown)}s</div>` : '';
                    const statusText = isDead ? 
                        (char.isDead && char.reviveCountdown > 0 ? '死亡中' : '已死亡') : 
                        `${Math.floor(char.currentHealth)}/${Math.floor(char.maxHealth)} HP`;
                    
                    return `
                        <div class="warehouse-character ${statusClass}" data-character-index="${startIndex + index}" style="cursor: pointer;">
                            <div class="character-avatar-small">${char.avatar}</div>
                            <div class="character-name-small">${char.getDisplayName()}</div>
                            ${char.type !== 'NPC' ? `<div class="character-profession-small">${char.profession}</div>` : ''}
                            <div class="character-level-small">等级 ${char.level}</div>
                            <div class="character-status-small ${statusClass}">${statusText}</div>
                            ${reviveText}
                        </div>
                    `;
                }).join('') : '<div class="empty-warehouse">仓库中没有角色</div>'}
            </div>
        `;
    }
    
    // 绑定仓库事件
    bindWarehouseEvents(container) {
        // 标签页切换
        const tabs = container.querySelectorAll('.warehouse-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.warehouseTab = tab.dataset.tab;
                this.initCharacterPanel();
            });
        });
        
        // 物品使用按钮事件
        const useButtons = container.querySelectorAll('.use-btn, .use-item-button');
        useButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止事件冒泡
                const itemName = btn.dataset.itemName;
                this.useWarehouseItem(itemName);
            });
        });
        
        // 蛋点击事件
        const warehouseEggs = container.querySelectorAll('.warehouse-egg[data-egg-index]');
        warehouseEggs.forEach(eggElement => {
            eggElement.addEventListener('click', () => {
                const eggIndex = parseInt(eggElement.dataset.eggIndex);
                const eggs = this.inventory.filter(item => item.type === '蛋');
                const egg = eggs[eggIndex];
                if (egg) {
                    this.jumpToIncubatorWithEgg(egg);
                }
            });
        });
        
        // 装备详情点击事件
        const equipmentItems = container.querySelectorAll('.warehouse-equipment[data-equipment-index]');
        equipmentItems.forEach(equipElement => {
            equipElement.addEventListener('click', () => {
                const equipmentIndex = parseInt(equipElement.dataset.equipmentIndex);
                const equipment = this.inventory.filter(item => item.type === '装备');
                const item = equipment[equipmentIndex];
                if (item) {
                    this.showEquipmentDetail(equipmentIndex);
                }
            });
        });
        
        // 消耗品点击使用事件
        const consumableItems = container.querySelectorAll('.consumable-item-clickable');
        consumableItems.forEach(consumableElement => {
            consumableElement.addEventListener('click', () => {
                const itemName = consumableElement.dataset.itemName;
                this.useWarehouseItem(itemName);
            });
        });
        
        // 新的圆点分页事件绑定系统
        const pageDots = container.querySelectorAll('.page-dot');
        pageDots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const page = parseInt(dot.dataset.page);
                const type = dot.dataset.type;
                
                console.log(`圆点分页点击: 类型=${type}, 页码=${page}`);
                
                // 根据类型设置对应的页码
                switch(type) {
                    case 'foods':
                        this.warehouseFoodPage = page;
                        break;
                    case 'eggs':
                        this.warehouseEggPage = page;
                        break;
                    case 'materials':
                        this.warehouseMaterialPage = page;
                        break;
                    case 'consumables':
                        this.warehouseConsumablePage = page;
                        break;
                    case 'equipment':
                        this.warehouseEquipmentPage = page;
                        break;
                    case 'books':
                        this.warehouseBookPage = page;
                        break;
                    case 'items':
                        this.warehouseItemPage = page;
                        break;
                    case 'characters':
                        // 处理角色标签页的圆点分页
                        if (this.currentCharacter && this.currentCharacter.name === '角色管理员') {
                            this.characterManagerPage = page;
                        } else {
                            this.warehouseCharacterPage = page;
                        }
                        break;
                    default:
                        console.warn('未知的分页类型:', type);
                        return;
                }
                
                // 刷新界面
                this.initCharacterPanel();
            });
        });
        
        // 翻页按钮 - 支持两种类名格式
        // 1. 旧格式：prev-page/next-page (装备标签页使用)
        const prevButtons = container.querySelectorAll('.prev-page');
        const nextButtons = container.querySelectorAll('.next-page');
        
        prevButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.warehouseTab === 'foods' && this.warehouseFoodPage > 0) {
                    this.warehouseFoodPage--;
                    this.initCharacterPanel();
                } else if (this.warehouseTab === 'eggs' && this.warehouseEggPage > 0) {
                    this.warehouseEggPage--;
                    this.initCharacterPanel();
                } else if (this.warehouseTab === 'materials' && this.warehouseMaterialPage > 0) {
                    this.warehouseMaterialPage--;
                    this.initCharacterPanel();
                } else if (this.warehouseTab === 'consumables' && this.warehouseConsumablePage > 0) {
                    this.warehouseConsumablePage--;
                    this.initCharacterPanel();
                } else if (this.warehouseTab === 'equipment' && this.warehouseEquipmentPage > 0) {
                    this.warehouseEquipmentPage--;
                    this.initCharacterPanel();
                } else if (this.warehouseTab === 'books' && this.warehouseBookPage > 0) {
                    this.warehouseBookPage--;
                    this.initCharacterPanel();
                } else if (this.warehouseTab === 'characters') {
                    // 处理角色标签页的翻页
                    if (this.currentCharacter && this.currentCharacter.name === '角色管理员') {
                        if (this.characterManagerPage > 0) {
                            this.characterManagerPage--;
                            this.initCharacterPanel();
                        }
                    } else {
                        if (this.warehouseCharacterPage > 0) {
                            this.warehouseCharacterPage--;
                            this.initCharacterPanel();
                        }
                    }
                }
            });
        });
        
        nextButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const itemsPerPage = 6;
                
                if (this.warehouseTab === 'foods') {
                    const foods = this.inventory.filter(item => item.type === '食物');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(foods) / itemsPerPage);
                    if (this.warehouseFoodPage < totalPages - 1) {
                        this.warehouseFoodPage++;
                        this.initCharacterPanel();
                    }
                } else if (this.warehouseTab === 'eggs') {
                    const eggs = this.inventory.filter(item => item.type === '蛋');
                    const totalPages = Math.ceil(eggs.length / itemsPerPage);
                    if (this.warehouseEggPage < totalPages - 1) {
                        this.warehouseEggPage++;
                        this.initCharacterPanel();
                    }
                } else if (this.warehouseTab === 'materials') {
                    const materials = this.inventory.filter(item => item.type === '材料');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(materials) / itemsPerPage);
                    if (this.warehouseMaterialPage < totalPages - 1) {
                        this.warehouseMaterialPage++;
                        this.initCharacterPanel();
                    }
                } else if (this.warehouseTab === 'consumables') {
                    const consumables = this.inventory.filter(item => item.type === '消耗品');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(consumables) / itemsPerPage);
                    if (this.warehouseConsumablePage < totalPages - 1) {
                        this.warehouseConsumablePage++;
                        this.initCharacterPanel();
                    }
                } else if (this.warehouseTab === 'equipment') {
                    const equipment = this.inventory.filter(item => item.type === '装备');
                    const totalPages = Math.ceil(equipment.length / itemsPerPage);
                    if (this.warehouseEquipmentPage < totalPages - 1) {
                        this.warehouseEquipmentPage++;
                        this.initCharacterPanel();
                    }
                } else if (this.warehouseTab === 'books') {
                    const books = this.inventory.filter(item => item.type === '书');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(books) / itemsPerPage);
                    if (this.warehouseBookPage < totalPages - 1) {
                        this.warehouseBookPage++;
                        this.initCharacterPanel();
                    }
                } else if (this.warehouseTab === 'characters') {
                    // 处理角色标签页的翻页
                    const totalPages = Math.ceil(this.characters.length / itemsPerPage);
                    if (this.currentCharacter && this.currentCharacter.name === '角色管理员') {
                        if (this.characterManagerPage < totalPages - 1) {
                            this.characterManagerPage++;
                            this.initCharacterPanel();
                        }
                    } else {
                        if (this.warehouseCharacterPage < totalPages - 1) {
                            this.warehouseCharacterPage++;
                            this.initCharacterPanel();
                        }
                    }
                }
            });
        });
        
        // 2. 新格式：page-btn prev-btn/next-btn with data-type (书籍、蛋类、物品标签页使用)
        const pagePrevButtons = container.querySelectorAll('.page-btn.prev-btn');
        const pageNextButtons = container.querySelectorAll('.page-btn.next-btn');
        
        pagePrevButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                
                if (type === 'foods' && this.warehouseFoodPage > 0) {
                    this.warehouseFoodPage--;
                    this.initCharacterPanel();
                } else if (type === 'eggs' && this.warehouseEggPage > 0) {
                    this.warehouseEggPage--;
                    this.initCharacterPanel();
                } else if (type === 'materials' && this.warehouseMaterialPage > 0) {
                    this.warehouseMaterialPage--;
                    this.initCharacterPanel();
                } else if (type === 'consumables' && this.warehouseConsumablePage > 0) {
                    this.warehouseConsumablePage--;
                    this.initCharacterPanel();
                } else if (type === 'equipment' && this.warehouseEquipmentPage > 0) {
                    this.warehouseEquipmentPage--;
                    this.initCharacterPanel();
                } else if (type === 'books' && this.warehouseBookPage > 0) {
                    this.warehouseBookPage--;
                    this.initCharacterPanel();
                } else if (type === 'characters') {
                    // 处理角色标签页的翻页
                    if (this.currentCharacter && this.currentCharacter.name === '角色管理员') {
                        if (this.characterManagerPage > 0) {
                            this.characterManagerPage--;
                            this.initCharacterPanel();
                        }
                    } else {
                        if (this.warehouseCharacterPage > 0) {
                            this.warehouseCharacterPage--;
                            this.initCharacterPanel();
                        }
                    }
                }
            });
        });
        
        pageNextButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const itemsPerPage = 6;
                
                if (type === 'foods') {
                    const foods = this.inventory.filter(item => item.type === '食物');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(foods) / itemsPerPage);
                    if (this.warehouseFoodPage < totalPages - 1) {
                        this.warehouseFoodPage++;
                        this.initCharacterPanel();
                    }
                } else if (type === 'eggs') {
                    const eggs = this.inventory.filter(item => item.type === '蛋');
                    const totalPages = Math.ceil(eggs.length / itemsPerPage);
                    if (this.warehouseEggPage < totalPages - 1) {
                        this.warehouseEggPage++;
                        this.initCharacterPanel();
                    }
                } else if (type === 'materials') {
                    const materials = this.inventory.filter(item => item.type === '材料');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(materials) / itemsPerPage);
                    if (this.warehouseMaterialPage < totalPages - 1) {
                        this.warehouseMaterialPage++;
                        this.initCharacterPanel();
                    }
                } else if (type === 'consumables') {
                    const consumables = this.inventory.filter(item => item.type === '消耗品');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(consumables) / itemsPerPage);
                    if (this.warehouseConsumablePage < totalPages - 1) {
                        this.warehouseConsumablePage++;
                        this.initCharacterPanel();
                    }
                } else if (type === 'equipment') {
                    const equipment = this.inventory.filter(item => item.type === '装备');
                    const totalPages = Math.ceil(equipment.length / itemsPerPage);
                    if (this.warehouseEquipmentPage < totalPages - 1) {
                        this.warehouseEquipmentPage++;
                        this.initCharacterPanel();
                    }
                } else if (type === 'books') {
                    const books = this.inventory.filter(item => item.type === '书');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(books) / itemsPerPage);
                    if (this.warehouseBookPage < totalPages - 1) {
                        this.warehouseBookPage++;
                        this.initCharacterPanel();
                    }
                } else if (type === 'items') {
                    const items = this.inventory.filter(item => item.type === '物品');
                    const totalPages = Math.ceil(this.getUniqueItemsCount(items) / itemsPerPage);
                    if (this.warehouseItemPage < totalPages - 1) {
                        this.warehouseItemPage++;
                        this.initCharacterPanel();
                    }
                } else if (type === 'characters') {
                    // 处理角色标签页的翻页
                    const totalPages = Math.ceil(this.characters.length / itemsPerPage);
                    if (this.currentCharacter && this.currentCharacter.name === '角色管理员') {
                        if (this.characterManagerPage < totalPages - 1) {
                            this.characterManagerPage++;
                            this.initCharacterPanel();
                        }
                    } else {
                        if (this.warehouseCharacterPage < totalPages - 1) {
                            this.warehouseCharacterPage++;
                            this.initCharacterPanel();
                        }
                    }
                }
            });
        });
        
        // 食物卡片悬停事件 - 显示详细信息弹窗
        const foodCards = container.querySelectorAll('.food-item-card');
        foodCards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                const itemName = card.dataset.itemName;
                const itemCount = parseInt(card.dataset.itemCount) || 1;
                this.showFoodDetailPopup(itemName, itemCount, e);
            });
            
            card.addEventListener('mouseleave', () => {
                this.hideFoodDetailPopup();
            });
        });
    }
    
    // 使用仓库中的物品
    useWarehouseItem(itemName) {
        console.log(`尝试使用仓库物品: ${itemName}`);
        
        // 找到对应的物品
        const item = this.inventory.find(item => item.name === itemName);
        if (!item) {
            console.log('物品不存在');
            return;
        }
        
        // 检查物品类型
        if (item.type !== '消耗品') {
            console.log('该物品不是消耗品，无法使用');
            return;
        }
        
        // 如果是技能书，显示角色选择面板
        if (item.skillId) {
            this.showSkillBookTargetSelection(item);
        } else {
            // 其他消耗品（如绷带、魔力胶囊），显示目标选择面板
            this.showConsumableTargetSelection(item);
        }
    }
    
    // 显示食物详细信息弹窗
    showFoodDetailPopup(itemName, itemCount, event) {
        // 移除已存在的弹窗
        this.hideFoodDetailPopup();
        
        // 查找物品信息
        const item = this.inventory.find(i => i.name === itemName && i.type === '食物');
        if (!item) return;
        
        // 获取物品的配方信息（如果有）
        const recipe = this.getCuisineRecipe(itemName);
        
        // 创建弹窗
        const popup = document.createElement('div');
        popup.className = 'food-detail-popup';
        popup.innerHTML = `
            <div class="food-detail-header">
                <div class="food-detail-icon">${item.icon}</div>
                <div class="food-detail-title">
                    <div class="food-detail-name" style="color: ${item.getRarityColor()}">${item.name}</div>
                    <div class="food-detail-count">数量: ×${itemCount}</div>
                </div>
            </div>
            <div class="food-detail-body">
                <div class="food-detail-row">
                    <span class="food-detail-label">类型:</span>
                    <span class="food-detail-value">${item.type}</span>
                </div>
                <div class="food-detail-row">
                    <span class="food-detail-label">稀有度:</span>
                    <span class="food-detail-value" style="color: ${item.getRarityColor()}">${item.rarity}</span>
                </div>
                <div class="food-detail-row">
                    <span class="food-detail-label">描述:</span>
                    <span class="food-detail-value">${item.description}</span>
                </div>
                ${item.effect ? `
                    <div class="food-detail-row">
                        <span class="food-detail-label">效果:</span>
                        <span class="food-detail-value food-effect-text">${item.effect}</span>
                    </div>
                ` : ''}
                ${recipe ? `
                    <div class="food-detail-divider"></div>
                    <div class="food-detail-recipe">
                        <div class="food-detail-recipe-title">🍳 制作配方</div>
                        <div class="food-detail-recipe-items">
                            ${recipe.materials.map(mat => `
                                <div class="recipe-material">
                                    ${mat.icon} ${mat.name} ×${mat.count}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 定位弹窗到画面中间
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    }
    
    // 隐藏食物详细信息弹窗
    hideFoodDetailPopup() {
        const existingPopup = document.querySelector('.food-detail-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
    }
    
    // 获取菜肴配方信息
    getCuisineRecipe(cuisineName) {
        const recipes = {
            '烤鱼': {
                materials: [
                    { name: '鱼', icon: '🐟', count: 2 }
                ]
            },
            '蔬菜炖肉': {
                materials: [
                    { name: '肉排', icon: '🥩', count: 1 },
                    { name: '胡萝卜', icon: '🥕', count: 2 },
                    { name: '土豆', icon: '🥔', count: 2 }
                ]
            },
            '蘑菇汤': {
                materials: [
                    { name: '蘑菇', icon: '🍄', count: 3 },
                    { name: '牛奶', icon: '🥛', count: 1 }
                ]
            },
            '烤鸡': {
                materials: [
                    { name: '鸡腿', icon: '🍗', count: 3 }
                ]
            },
            '水果沙拉': {
                materials: [
                    { name: '番茄', icon: '🍅', count: 2 },
                    { name: '香蕉', icon: '🍌', count: 2 }
                ]
            },
            '海鲜拼盘': {
                materials: [
                    { name: '鱼', icon: '🐟', count: 3 },
                    { name: '烤鱼', icon: '🐟🔥', count: 2 }
                ]
            },
            '高级牛排': {
                materials: [
                    { name: '肉排', icon: '🥩', count: 3 }
                ]
            },
            '皇家盛宴': {
                materials: [
                    { name: '烤鸡', icon: '🍗', count: 1 },
                    { name: '高级牛排', icon: '🥩', count: 1 },
                    { name: '水果沙拉', icon: '🥗', count: 1 }
                ]
            },
            '龙肉火锅': {
                materials: [
                    { name: '肉排', icon: '🥩', count: 5 },
                    { name: '蘑菇', icon: '🍄', count: 3 },
                    { name: '胡萝卜', icon: '🥕', count: 3 },
                    { name: '土豆', icon: '🥔', count: 3 }
                ]
            },
            '魔法蛋糕': {
                materials: [
                    { name: '牛奶', icon: '🥛', count: 2 },
                    { name: '香蕉', icon: '🍌', count: 2 },
                    { name: '茶', icon: '🍵', count: 1 }
                ]
            }
        };
        
        return recipes[cuisineName] || null;
    }
    
    // 显示技能书目标选择面板
    showSkillBookTargetSelection(skillBook) {
        console.log(`准备显示技能书目标选择: ${skillBook.name}`);
        
        // 检查是否已存在模态框，如果存在则先关闭
        const existingModal = document.querySelector('.target-selection-modal');
        if (existingModal) {
            console.log('发现已存在的目标选择面板，先关闭');
            this.closeTargetSelectionModal(existingModal);
        }
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'target-selection-modal';
        
        // 获取可以学习该技能的角色（玩家角色且未学会该技能）
        const availableCharacters = this.characters.filter(char => 
            char.type === 'Player' && !char.hasLearnedSkill(skillBook.skillId)
        );
        
        console.log(`找到 ${availableCharacters.length} 个可以学习该技能的角色`);
        
        modal.innerHTML = `
            <div class="target-selection-panel">
                <div class="target-selection-header">
                    <div class="target-selection-title">选择学习角色 - ${skillBook.name}</div>
                    <button class="close-target-selection-btn">×</button>
                </div>
                
                <div class="skill-book-info">
                    <div class="skill-book-icon">${skillBook.icon}</div>
                    <div class="skill-book-details">
                        <div class="skill-book-name">${skillBook.name}</div>
                        <div class="skill-book-description">${skillBook.description}</div>
                        <div class="skill-book-effect">${skillBook.effect}</div>
                    </div>
                </div>
                
                <div class="target-selection-content">
                    ${availableCharacters.length > 0 ? `
                        <div class="target-list">
                            ${availableCharacters.map((character, index) => `
                                <div class="target-character" data-character-index="${this.characters.indexOf(character)}">
                                    <div class="target-avatar">${character.avatar}</div>
                                    <div class="target-info">
                                        <div class="target-name">${character.getDisplayName()}</div>
                                        <div class="target-level">等级 ${character.level}</div>
                                        <div class="target-skills">已学技能: ${character.learnedSkills.length}/∞</div>
                                    </div>
                                    <div class="target-action">
                                        <button class="target-btn learn-btn" data-character-index="${this.characters.indexOf(character)}">学习</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="no-targets">
                            <div class="no-targets-message">没有可以学习该技能的角色</div>
                            <div class="no-targets-hint">所有角色都已学会此技能或没有玩家角色</div>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        // 添加到DOM
        document.body.appendChild(modal);
        console.log('目标选择面板已添加到DOM');
        
        // 立即绑定事件
        try {
            this.bindSkillBookTargetEvents(modal, skillBook);
            console.log('目标选择面板事件绑定完成');
        } catch (error) {
            console.error('绑定目标选择面板事件时出错:', error);
        }
        
        // 触发淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
            console.log('目标选择面板淡入动画已触发');
        }, 10);
    }
    
    // 绑定技能书目标选择事件
    bindSkillBookTargetEvents(modal, skillBook) {
        // 关闭按钮
        modal.querySelector('.close-target-selection-btn').addEventListener('click', () => {
            this.closeTargetSelectionModal(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeTargetSelectionModal(modal);
            }
        });
        
        // 学习按钮
        const learnButtons = modal.querySelectorAll('.learn-btn');
        learnButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const characterIndex = parseInt(btn.dataset.characterIndex);
                const character = this.characters[characterIndex];
                
                if (character) {
                    this.useSkillBookOnCharacter(skillBook, character);
                    this.closeTargetSelectionModal(modal);
                }
            });
        });
    }
    
    // 显示消耗品目标选择面板
    showConsumableTargetSelection(item) {
        console.log(`显示消耗品目标选择: ${item.name}`);
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'target-selection-modal';
        
        // 获取可以使用该消耗品的角色（玩家角色且存活）
        const availableCharacters = this.characters.filter(char => 
            char.type === 'Player' && !char.isDead
        );
        
        modal.innerHTML = `
            <div class="target-selection-panel">
                <div class="target-selection-header">
                    <div class="target-selection-title">选择使用目标 - ${item.name}</div>
                    <button class="close-target-selection-btn">×</button>
                </div>
                
                <div class="consumable-info">
                    <div class="consumable-icon">${item.icon}</div>
                    <div class="consumable-details">
                        <div class="consumable-name">${item.name}</div>
                        <div class="consumable-description">${item.description}</div>
                        <div class="consumable-effect">${item.effect}</div>
                    </div>
                </div>
                
                <div class="target-selection-content">
                    ${availableCharacters.length > 0 ? `
                        <div class="target-list">
                            ${availableCharacters.map((character, index) => `
                                <div class="target-character" data-character-index="${this.characters.indexOf(character)}">
                                    <div class="target-avatar">${character.avatar}</div>
                                    <div class="target-info">
                                        <div class="target-name">${character.getDisplayName()}</div>
                                        <div class="target-level">等级 ${character.level}</div>
                                        <div class="target-health">生命: ${Math.floor(character.currentHealth)}/${Math.floor(character.maxHealth)}</div>
                                        <div class="target-mana">魔法: ${Math.floor(character.currentMana)}/${Math.floor(character.maxMana)}</div>
                                    </div>
                                    <div class="target-action">
                                        <button class="target-btn use-btn" data-character-index="${this.characters.indexOf(character)}">使用</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="no-targets">
                            <div class="no-targets-message">没有可以使用该物品的角色</div>
                            <div class="no-targets-hint">没有存活的玩家角色</div>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        this.bindConsumableTargetEvents(modal, item);
        
        // 触发淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
    }
    
    // 绑定消耗品目标选择事件
    bindConsumableTargetEvents(modal, item) {
        // 关闭按钮
        modal.querySelector('.close-target-selection-btn').addEventListener('click', () => {
            this.closeTargetSelectionModal(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeTargetSelectionModal(modal);
            }
        });
        
        // 使用按钮
        const useButtons = modal.querySelectorAll('.use-btn');
        useButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const characterIndex = parseInt(btn.dataset.characterIndex);
                const character = this.characters[characterIndex];
                
                if (character) {
                    this.useConsumableOnCharacter(item, character);
                    this.closeTargetSelectionModal(modal);
                }
            });
        });
    }
    
    // 关闭目标选择模态框
    closeTargetSelectionModal(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    // 在角色身上使用消耗品
    useConsumableOnCharacter(item, character) {
        console.log(`${character.getDisplayName()} 使用消耗品: ${item.name}`);
        
        let success = false;
        
        // 根据物品类型应用效果
        switch(item.name) {
            case '绷带':
                if (character.currentHealth < character.maxHealth) {
                    const oldHealth = character.currentHealth;
                    const healAmount = 20;
                    character.currentHealth = Math.min(character.currentHealth + healAmount, character.maxHealth);
                    const actualHealing = character.currentHealth - oldHealth;
                    
                    console.log(`${character.getDisplayName()} 恢复了 ${actualHealing} 点生命值`);
                    
                    // 显示治疗效果（消耗品图标+数字）
                    if (actualHealing > 0 && this.showHealingNumbers) {
                        this.showHealingEffect(
                            character.x,
                            character.y - character.radius - 15,
                            actualHealing,
                            item.icon, // 使用绷带图标 🩹
                            'consumable'
                        );
                    }
                    
                    success = true;
                } else {
                    console.log(`${character.getDisplayName()} 生命值已满，无需使用绷带`);
                }
                break;
                
            case '魔力胶囊':
                if (character.currentMana < character.maxMana) {
                    const oldMana = character.currentMana;
                    const manaAmount = 100;
                    character.currentMana = Math.min(character.currentMana + manaAmount, character.maxMana);
                    const actualManaRestore = character.currentMana - oldMana;
                    
                    console.log(`${character.getDisplayName()} 恢复了 ${actualManaRestore} 点魔法值`);
                    
                    // 显示魔法恢复效果（消耗品图标+数字）
                    if (actualManaRestore > 0 && this.showHealingNumbers) {
                        this.showManaRestoreEffect(
                            character.x,
                            character.y - character.radius - 15,
                            actualManaRestore,
                            item.icon // 使用魔力胶囊图标 💊
                        );
                    }
                    
                    success = true;
                } else {
                    console.log(`${character.getDisplayName()} 魔法值已满，无需使用魔力胶囊`);
                }
                break;
                
            case '经验笔记':
                // 计算经验值：50 + 最大经验值 * 25%
                const expGain = 50 + Math.floor(character.maxExp * 0.25);
                character.currentExp += expGain;
                
                console.log(`${character.getDisplayName()} 获得了 ${expGain} 点经验值`);
                
                // 检查是否升级
                while (character.currentExp >= character.maxExp && character.level < 100) {
                    this.levelUpCharacter(character);
                }
                
                // 显示经验获得效果（只在角色有位置信息时显示）
                if (this.showHealingNumbers && character.x !== undefined && character.y !== undefined && character.radius !== undefined) {
                    this.showHealingEffect(
                        character.x,
                        character.y - character.radius - 15,
                        expGain,
                        item.icon, // 使用经验笔记图标 📜
                        'exp'
                    );
                }
                
                success = true;
                
                // 使用成功后显示角色详情面板
                setTimeout(() => {
                    this.showCharacterDetail(character);
                }, 100);
                
                break;
                
            default:
                console.log(`未知的消耗品类型: ${item.name}`);
        }
        
        if (success) {
            // 从背包中移除物品
            const itemIndex = this.inventory.indexOf(item);
            if (itemIndex > -1) {
                this.inventory.splice(itemIndex, 1);
                console.log(`已从背包中移除: ${item.name}`);
            }
            
            // 刷新界面
            this.initCharacterPanel();
            
            // 如果在战斗面板，也刷新战斗面板
            if (this.currentLevel && (this.currentLevel.id === 7 || this.currentLevel.id === 8)) {
                this.updateBattlePanel();
            }
        }
        
        return success;
    }
    
    // 创建村长任务UI
    createVillageChiefUI(container, character) {
        const allQuests = [...this.availableQuests, ...this.acceptedQuests, ...this.completedQuests];
        
        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="npc-description">
                <div class="section-title">角色介绍</div>
                <div class="npc-info">
                    ${this.getNPCDescription(character.name)}
                </div>
            </div>
            
            <div class="quest-section">
                <div class="section-title">📋 任务系统</div>
                
                <div class="quest-tabs">
                    <button class="quest-tab active" data-tab="available">可接取 (${this.availableQuests.length})</button>
                    <button class="quest-tab" data-tab="accepted">进行中 (${this.acceptedQuests.length})</button>
                    <button class="quest-tab" data-tab="completed">已完成 (${this.completedQuests.length})</button>
                </div>
                
                <div class="quest-content">
                    <div class="quest-list" id="quest-list-available">
                        ${this.createQuestListHTML(this.availableQuests, 'available')}
                    </div>
                    <div class="quest-list hidden" id="quest-list-accepted">
                        ${this.createQuestListHTML(this.acceptedQuests, 'accepted')}
                    </div>
                    <div class="quest-list hidden" id="quest-list-completed">
                        ${this.createQuestListHTML(this.completedQuests, 'completed')}
                    </div>
                </div>
            </div>
        `;
        
        // 绑定任务标签页切换事件
        const questTabs = container.querySelectorAll('.quest-tab');
        questTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 更新标签页状态
                questTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 显示对应的任务列表
                const targetTab = tab.dataset.tab;
                const questLists = container.querySelectorAll('.quest-list');
                questLists.forEach(list => {
                    if (list.id === `quest-list-${targetTab}`) {
                        list.classList.remove('hidden');
                    } else {
                        list.classList.add('hidden');
                    }
                });
            });
        });
        
        // 绑定任务按钮事件
        this.bindQuestEvents(container);
    }
    
    // 创建任务列表HTML
    createQuestListHTML(quests, type) {
        if (quests.length === 0) {
            const emptyMessages = {
                'available': '暂无可接取的任务',
                'accepted': '暂无进行中的任务',
                'completed': '暂无已完成的任务'
            };
            return `<div class="empty-quest-list">${emptyMessages[type]}</div>`;
        }
        
        return quests.map(quest => `
            <div class="quest-item" data-quest-id="${quest.id}">
                <div class="quest-header">
                    <div class="quest-name">${quest.name}</div>
                    <div class="quest-stars">${quest.getStarDisplay()}</div>
                </div>
                
                <div class="quest-description">${quest.description}</div>
                
                <div class="quest-progress">
                    <div class="progress-text">${quest.getProgressText()}</div>
                    ${type === 'accepted' ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${this.getQuestProgressPercent(quest)}%"></div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="quest-rewards">
                    <div class="rewards-label">奖励:</div>
                    <div class="rewards-text">${quest.getRewardText()}</div>
                </div>
                
                <div class="quest-actions">
                    ${this.createQuestActionButtons(quest, type)}
                </div>
            </div>
        `).join('');
    }
    
    // 创建任务操作按钮
    createQuestActionButtons(quest, type) {
        switch(type) {
            case 'available':
                return `<button class="quest-btn accept-btn" data-quest-id="${quest.id}">接取任务</button>`;
            case 'accepted':
                const canSubmit = quest.isCompleted();
                return `
                    <button class="quest-btn submit-btn ${canSubmit ? '' : 'disabled'}" 
                            data-quest-id="${quest.id}" 
                            ${canSubmit ? '' : 'disabled'}>
                        ${canSubmit ? '提交任务' : '未完成'}
                    </button>
                    <button class="quest-btn abandon-btn" data-quest-id="${quest.id}">放弃任务</button>
                `;
            case 'completed':
                return `<div class="quest-completed-label">✅ 已完成</div>`;
            default:
                return '';
        }
    }
    
    // 获取任务进度百分比
    getQuestProgressPercent(quest) {
        switch(quest.type) {
            case 'kill':
                return Math.min(100, ((quest.progress.killed || 0) / quest.requirements.killCount) * 100);
            case 'collect':
                return Math.min(100, ((quest.progress.collected || 0) / quest.requirements.collectCount) * 100);
            case 'level':
                return Math.min(100, ((quest.progress.level || 1) / quest.requirements.targetLevel) * 100);
            default:
                return 0;
        }
    }
    
    // 绑定任务事件
    bindQuestEvents(container) {
        // 接取任务按钮
        const acceptBtns = container.querySelectorAll('.accept-btn');
        acceptBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const questId = btn.dataset.questId;
                if (this.acceptQuest(questId)) {
                    this.initCharacterPanel(); // 刷新界面
                }
            });
        });
        
        // 提交任务按钮
        const submitBtns = container.querySelectorAll('.submit-btn:not(.disabled)');
        submitBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const questId = btn.dataset.questId;
                if (this.submitQuest(questId)) {
                    this.initCharacterPanel(); // 刷新界面
                }
            });
        });
        
        // 放弃任务按钮
        const abandonBtns = container.querySelectorAll('.abandon-btn');
        abandonBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const questId = btn.dataset.questId;
                if (confirm('确定要放弃这个任务吗？任务进度将会重置。')) {
                    if (this.abandonQuest(questId)) {
                        this.initCharacterPanel(); // 刷新界面
                    }
                }
            });
        });
    }
    
    // 显示驱逐角色选择面板
    showDismissCharacterSelection() {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'target-selection-modal';
        
        // 获取可以驱逐的角色（玩家角色）
        const dismissableCharacters = this.characters.filter(char => char.type === 'Player');
        
        modal.innerHTML = `
            <div class="target-selection-panel">
                <div class="target-selection-header">
                    <div class="target-selection-title">🚫 选择要驱逐的角色</div>
                    <button class="close-target-selection-btn">×</button>
                </div>
                
                <div class="dismiss-warning" style="
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    border-radius: 4px;
                    padding: 12px;
                    margin: 15px 0;
                    color: #856404;
                    font-size: 13px;
                ">
                    <strong>⚠️ 警告：</strong>驱逐角色后将永久移除该角色，但会获得经验笔记作为补偿。
                    <br>补偿数量 = 角色等级 × 1
                </div>
                
                <div class="target-selection-content">
                    ${dismissableCharacters.length > 0 ? `
                        <div class="target-list">
                            ${dismissableCharacters.map((character, index) => {
                                const expNoteReward = character.level * 1;
                                const isInBattleTeam = this.battleTeam.includes(character);
                                return `
                                    <div class="target-character" data-character-index="${this.characters.indexOf(character)}">
                                        <div class="target-avatar">${character.avatar}</div>
                                        <div class="target-info">
                                            <div class="target-name">${character.getDisplayName()}</div>
                                            <div class="target-level">等级 ${character.level} | ${character.profession}</div>
                                            <div class="target-reward" style="color: #4CAF50; font-size: 12px;">
                                                💰 补偿: 经验笔记 × ${expNoteReward}
                                            </div>
                                            ${isInBattleTeam ? '<div style="color: #f44336; font-size: 11px;">⚠️ 当前在编队中</div>' : ''}
                                        </div>
                                        <div class="target-action">
                                            <button class="target-btn dismiss-btn" data-character-index="${this.characters.indexOf(character)}" style="background: #f44336;">驱逐</button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="no-targets">
                            <div class="no-targets-message">没有可以驱逐的角色</div>
                            <div class="no-targets-hint">所有角色都是NPC或没有玩家角色</div>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        this.bindDismissCharacterEvents(modal);
        
        // 触发淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
    }
    
    // 绑定驱逐角色事件
    bindDismissCharacterEvents(modal) {
        // 关闭按钮
        modal.querySelector('.close-target-selection-btn').addEventListener('click', () => {
            this.closeDismissModal(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDismissModal(modal);
            }
        });
        
        // 驱逐按钮
        const dismissButtons = modal.querySelectorAll('.dismiss-btn');
        dismissButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const characterIndex = parseInt(btn.dataset.characterIndex);
                const character = this.characters[characterIndex];
                
                if (character) {
                    // 二次确认
                    if (confirm(`确定要驱逐 ${character.getDisplayName()} 吗？\n\n此操作不可撤销！\n\n你将获得 ${character.level} 个经验笔记作为补偿。`)) {
                        this.dismissCharacter(character);
                        this.closeDismissModal(modal);
                    }
                }
            });
        });
    }
    
    // 关闭驱逐模态框
    closeDismissModal(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    // 驱逐角色
    dismissCharacter(character) {
        console.log(`驱逐角色: ${character.getDisplayName()}`);
        
        // 计算经验笔记奖励
        const expNoteReward = character.level * 1;
        
        // 从编队中移除
        const teamIndex = this.battleTeam.indexOf(character);
        if (teamIndex !== -1) {
            this.battleTeam[teamIndex] = null;
            console.log(`已从编队槽位 ${teamIndex} 移除角色`);
        }
        
        // 从角色列表中移除
        const characterIndex = this.characters.indexOf(character);
        if (characterIndex !== -1) {
            this.characters.splice(characterIndex, 1);
            console.log(`已从角色列表移除角色`);
        }
        
        // 如果是当前选中的角色，清除选择
        if (this.selectedCharacter === character) {
            this.selectedCharacter = null;
        }
        
        // 添加经验笔记到背包 - 修复：使用正确的预设ID 'experience_note'
        const expNotePreset = ItemPresets.getPreset('experience_note');
        if (expNotePreset) {
            for (let i = 0; i < expNoteReward; i++) {
                const expNote = new Item({
                    id: expNotePreset.id,
                    type: expNotePreset.type,
                    name: expNotePreset.name,
                    icon: expNotePreset.icon,
                    description: expNotePreset.description,
                    effect: expNotePreset.effect,
                    rarity: expNotePreset.rarity,
                    sellPrice: expNotePreset.sellPrice,
                    quantity: 1
                });
                this.inventory.push(expNote);
            }
            console.log(`已获得 ${expNoteReward} 个经验笔记`);
        } else {
            console.error('无法找到经验笔记预设 (experience_note)');
        }
        
        // 显示浮动文本
        if (this.characters.length > 0) {
            const displayChar = this.characters[0];
            if (displayChar.x !== undefined && displayChar.y !== undefined) {
                this.showFloatingText(
                    displayChar.x, 
                    displayChar.y - 40, 
                    `驱逐成功！获得经验笔记×${expNoteReward}`, 
                    '#4CAF50'
                );
            }
        }
        
        // 刷新界面
        this.initCharacterPanel();
        
        console.log(`✅ 驱逐完成！获得 ${expNoteReward} 个经验笔记`);
    }
    
    // 显示角色详情面板
    showCharacterDetail(character) {
        // 修复角色的技能对象方法（如果需要）
        this.fixCharacterSkills(character);
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'character-detail-modal';
        modal.innerHTML = `
            <div class="character-detail-panel">
                <div class="character-detail-header">
                    <div class="character-detail-title">角色详情</div>
                    <button class="close-detail-btn">×</button>
                </div>
                
                <div class="character-detail-content">
                    <div class="character-detail-info">
                        <div class="character-info-left">
                            <div class="character-detail-avatar">${character.avatar}</div>
                            <div class="character-detail-name">${character.getDisplayName()}</div>
                            <div class="character-detail-meta">
                                <span class="character-level">等级 ${character.level}</span>
                                ${character.type !== 'NPC' ? `<span class="character-profession">${character.profession}</span>` : ''}
                            </div>
                        </div>
                        
                        <div class="character-info-right">
                            <div class="character-detail-bars">
                                <div class="health-bar-container">
                                    <div class="bar-label">生命值</div>
                                    <div class="health-bar">
                                        <div class="health-fill" style="width: ${(character.currentHealth / character.maxHealth) * 100}%"></div>
                                    </div>
                                    <div class="bar-text">${Math.floor(character.currentHealth)}/${Math.floor(character.maxHealth)}</div>
                                </div>
                                <div class="mana-bar-container">
                                    <div class="bar-label">魔法值</div>
                                    <div class="mana-bar">
                                        <div class="mana-fill" style="width: ${(character.currentMana / character.maxMana) * 100}%"></div>
                                    </div>
                                    <div class="bar-text">${Math.floor(character.currentMana)}/${Math.floor(character.maxMana)}</div>
                                </div>
                                <div class="exp-bar-container">
                                    <div class="bar-label">经验值</div>
                                    <div class="exp-bar">
                                        <div class="exp-fill" style="width: ${(character.currentExp / character.maxExp) * 100}%"></div>
                                    </div>
                                    <div class="bar-text">${Math.floor(character.currentExp)}/${Math.floor(character.maxExp)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="character-detail-attributes-section">
                        <div class="character-detail-attributes">
                            <div class="section-title">主属性</div>
                            <div class="attributes-grid">
                                <div class="attribute-item">
                                    <span class="attribute-icon">💪</span>
                                    <span class="attribute-name">力量</span>
                                    <span class="attribute-value">${character.attributes.strength}</span>
                                </div>
                                <div class="attribute-item">
                                    <span class="attribute-icon">👟</span>
                                    <span class="attribute-name">敏捷</span>
                                    <span class="attribute-value">${character.attributes.agility}</span>
                                </div>
                                <div class="attribute-item">
                                    <span class="attribute-icon">🧠</span>
                                    <span class="attribute-name">智慧</span>
                                    <span class="attribute-value">${character.attributes.intelligence}</span>
                                </div>
                                <div class="attribute-item">
                                    <span class="attribute-icon">🔧</span>
                                    <span class="attribute-name">技巧</span>
                                    <span class="attribute-value">${character.attributes.skill}</span>
                                </div>
                            </div>
                            
                            <div class="character-detail-secondary-attributes">
                                <div class="section-title">副属性</div>
                                <div class="secondary-attributes-grid">
                                    <div class="secondary-attribute-item">
                                        <span class="attribute-icon">⚔️</span>
                                        <span class="attribute-name">攻击力</span>
                                        <span class="attribute-value">${character.secondaryAttributes.attackPower}</span>
                                    </div>
                                    <div class="secondary-attribute-item">
                                        <span class="attribute-icon">🛡️</span>
                                        <span class="attribute-name">防御力</span>
                                        <span class="attribute-value">${character.secondaryAttributes.defense}</span>
                                    </div>
                                    <div class="secondary-attribute-item">
                                        <span class="attribute-icon">💨</span>
                                        <span class="attribute-name">移动速度</span>
                                        <span class="attribute-value">${character.secondaryAttributes.moveSpeed}</span>
                                    </div>
                                    <div class="secondary-attribute-item">
                                        <span class="attribute-icon">🩹</span>
                                        <span class="attribute-name">生命恢复</span>
                                        <span class="attribute-value">${character.secondaryAttributes.healthRegen.toFixed(1)}/秒</span>
                                    </div>
                                    <div class="secondary-attribute-item">
                                        <span class="attribute-icon">💙</span>
                                        <span class="attribute-name">魔法恢复</span>
                                        <span class="attribute-value">${character.secondaryAttributes.manaRegen.toFixed(1)}/秒</span>
                                    </div>
                                    <div class="secondary-attribute-item">
                                        <span class="attribute-icon">⚖️</span>
                                        <span class="attribute-name">体重</span>
                                        <span class="attribute-value">${character.secondaryAttributes.weight}kg</span>
                                    </div>
                                    <div class="secondary-attribute-item">
                                        <span class="attribute-icon">📦</span>
                                        <span class="attribute-name">体积</span>
                                        <span class="attribute-value">${character.secondaryAttributes.volume}L</span>
                                    </div>
                                    <div class="secondary-attribute-item">
                                        <span class="attribute-icon">⭐</span>
                                        <span class="attribute-name">经验获取</span>
                                        <span class="attribute-value">${character.secondaryAttributes.expGain}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="character-detail-skills">
                        <div class="section-title">技能</div>
                        <div class="skills-grid">
                            ${character.skills.map((skill, index) => {
                                const isLocked = character.skillSlotLocks[index];
                                const isPassiveSlot = index === 0; // 第一个槽位是被动技能槽
                                const isActiveSlot = index === 1; // 第二个槽位是主动技能槽
                                let slotClass = isLocked ? 'locked' : (skill ? 'filled equipped' : '');
                                if (isPassiveSlot) slotClass += ' passive-slot';
                                if (isActiveSlot) slotClass += ' active-slot';
                                
                                return `
                                    <div class="skill-slot ${slotClass}" data-skill-index="${index}">
                                        ${skill ? `
                                            <div class="skill-slot-header">
                                                <div class="skill-slot-icon">${skill.icon}</div>
                                                <div class="skill-slot-info">
                                                    <div class="skill-slot-name">${skill.name}</div>
                                                    <div class="skill-slot-type">${skill.getTypeText()}</div>
                                                </div>
                                            </div>
                                            <div class="skill-slot-description">${skill.description}</div>
                                        ` : `
                                            <div class="skill-placeholder">
                                                <div class="skill-icon">${isLocked ? '🔒' : (isPassiveSlot ? '⭐' : (isActiveSlot ? '⚡' : '➕'))}</div>
                                                <div class="skill-text">${isLocked ? '锁定' : (isPassiveSlot ? '被动技能' : (isActiveSlot ? '主动技能' : '空槽位'))}</div>
                                            </div>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="character-detail-equipment">
                        <div class="section-title">装备</div>
                        <div class="equipment-grid">
                            <div class="equipment-slot ${character.equipment.weapon ? 'equipped' : ''}" data-slot="weapon">
                                <div class="slot-label">武器</div>
                                <div class="slot-content">
                                    ${character.equipment.weapon ? `
                                        <div class="equipped-item">
                                            <div class="item-icon">${character.equipment.weapon.icon}</div>
                                            <div class="item-name">${character.equipment.weapon.name}</div>
                                            <div class="item-main-affix">主词条: ${character.equipment.weapon.mainAffix}</div>
                                            <div class="item-sub-affixes">
                                                ${character.equipment.weapon.subAffixes.map(affix => 
                                                    `<div class="sub-affix-mini" style="color: ${this.getAffixRarityColor(affix.rarity)}">副词条-${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value}</div>`
                                                ).join('')}
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="empty-slot">
                                            <div class="slot-icon">⚔️</div>
                                            <div class="slot-text">点击装备</div>
                                        </div>
                                    `}
                                </div>
                            </div>
                            <div class="equipment-slot ${character.equipment.armor ? 'equipped' : ''}" data-slot="armor">
                                <div class="slot-label">护甲</div>
                                <div class="slot-content">
                                    ${character.equipment.armor ? `
                                        <div class="equipped-item">
                                            <div class="item-icon">${character.equipment.armor.icon}</div>
                                            <div class="item-name">${character.equipment.armor.name}</div>
                                            <div class="item-main-affix">主词条: ${character.equipment.armor.mainAffix}</div>
                                            <div class="item-sub-affixes">
                                                ${character.equipment.armor.subAffixes.map(affix => 
                                                    `<div class="sub-affix-mini" style="color: ${this.getAffixRarityColor(affix.rarity)}">副词条-${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value}</div>`
                                                ).join('')}
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="empty-slot">
                                            <div class="slot-icon">🦺</div>
                                            <div class="slot-text">点击装备</div>
                                        </div>
                                    `}
                                </div>
                            </div>
                            <div class="equipment-slot ${character.equipment.offhand ? 'equipped' : ''}" data-slot="offhand">
                                <div class="slot-label">副手</div>
                                <div class="slot-content">
                                    ${character.equipment.offhand ? `
                                        <div class="equipped-item">
                                            <div class="item-icon">${character.equipment.offhand.icon}</div>
                                            <div class="item-name">${character.equipment.offhand.name}</div>
                                            <div class="item-main-affix">主词条: ${character.equipment.offhand.mainAffix}</div>
                                            <div class="item-sub-affixes">
                                                ${character.equipment.offhand.subAffixes.map(affix => 
                                                    `<div class="sub-affix-mini" style="color: ${this.getAffixRarityColor(affix.rarity)}">副词条-${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value}</div>`
                                                ).join('')}
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="empty-slot">
                                            <div class="slot-icon">🛡️</div>
                                            <div class="slot-text">点击装备</div>
                                        </div>
                                    `}
                                </div>
                            </div>
                            <div class="equipment-slot ${character.equipment.misc ? 'equipped' : ''}" data-slot="misc">
                                <div class="slot-label">杂项</div>
                                <div class="slot-content">
                                    ${character.equipment.misc ? `
                                        <div class="equipped-item">
                                            <div class="item-icon">${character.equipment.misc.icon}</div>
                                            <div class="item-name">${character.equipment.misc.name}</div>
                                            <div class="item-main-affix">主词条: ${character.equipment.misc.mainAffix}</div>
                                            <div class="item-sub-affixes">
                                                ${character.equipment.misc.subAffixes.map(affix => 
                                                    `<div class="sub-affix-mini" style="color: ${this.getAffixRarityColor(affix.rarity)}">副词条-${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value}</div>`
                                                ).join('')}
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="empty-slot">
                                            <div class="slot-icon">💍</div>
                                            <div class="slot-text">点击装备</div>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 触发淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
        
        // 绑定关闭事件
        modal.querySelector('.close-detail-btn').addEventListener('click', () => {
            this.closeCharacterDetail(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCharacterDetail(modal);
            }
        });
        
        // 绑定技能槽点击事件
        modal.querySelectorAll('.character-detail-skills .skill-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const skillIndex = parseInt(e.currentTarget.dataset.skillIndex);
                
                console.log(`角色详情面板：点击了技能槽位${skillIndex}，数据索引: ${e.currentTarget.dataset.skillIndex}`);
                
                // 检查是否是被动技能槽（槽位0），被动技能槽无法点击
                if (skillIndex === 0) {
                    console.log(`技能槽 ${skillIndex + 1} 是被动技能槽，无法点击操作`);
                    return;
                }
                
                // 检查技能槽是否被锁定
                if (character.skillSlotLocks && character.skillSlotLocks[skillIndex]) {
                    console.log(`技能槽 ${skillIndex + 1} 被锁定，无法操作`);
                    return;
                }
                
                console.log(`准备打开技能选择面板，角色: ${character.getDisplayName()}，槽位: ${skillIndex + 1}`);
                
                try {
                    this.showSkillSelectionPanel(character, skillIndex);
                } catch (error) {
                    console.error('打开技能选择面板时出错:', error);
                }
            });
        });
        
        // 绑定装备槽点击事件
        modal.querySelectorAll('.character-detail-equipment .equipment-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotType = e.currentTarget.dataset.slot;
                console.log(`点击了装备槽位: ${slotType}`);
                this.showEquipmentSelectionPanel(character, slotType);
            });
        });
        
        console.log(`角色详情面板事件绑定完成，找到技能槽数量: ${modal.querySelectorAll('.character-detail-skills .skill-slot').length}`);
        
        console.log('显示角色详情:', character.getDisplayName());
    }
    
    // 显示装备选择面板
    showEquipmentSelectionPanel(character, slotType) {
        // 获取对应类型的装备
        const equipmentTypeMap = {
            'weapon': '武器',
            'armor': '护甲', 
            'offhand': '副手',
            'misc': '杂项'
        };
        
        const targetEquipmentType = equipmentTypeMap[slotType];
        const availableEquipment = this.inventory.filter(item => 
            item.type === '装备' && item.equipmentType === targetEquipmentType
        );
        
        // 创建装备选择模态框
        const modal = document.createElement('div');
        modal.className = 'equipment-selection-modal';
        modal.innerHTML = `
            <div class="equipment-selection-panel">
                <div class="equipment-selection-header">
                    <div class="equipment-selection-title">选择${targetEquipmentType}</div>
                    <button class="close-equipment-selection-btn">×</button>
                </div>
                
                <div class="equipment-selection-content">
                    <div class="current-equipment">
                        <div class="section-title">当前装备</div>
                        <div class="current-equipment-display">
                            ${character.equipment[slotType] ? `
                                <div class="equipment-item current" data-action="unequip">
                                    <div class="item-icon">${character.equipment[slotType].icon}</div>
                                    <div class="item-info">
                                        <div class="item-name">${character.equipment[slotType].name}</div>
                                        <div class="item-main-affix">主词条: ${character.equipment[slotType].mainAffix}</div>
                                        <div class="item-sub-affixes">
                                            ${character.equipment[slotType].subAffixes.map(affix => 
                                                `<div class="sub-affix">副词条-${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value}</div>`
                                            ).join('')}
                                        </div>
                                    </div>
                                    <div class="item-action">
                                        <button class="unequip-btn">卸下</button>
                                    </div>
                                </div>
                            ` : `
                                <div class="no-equipment">未装备${targetEquipmentType}</div>
                            `}
                        </div>
                    </div>
                    
                    <div class="available-equipment">
                        <div class="section-title">可用装备 (${availableEquipment.length})</div>
                        <div class="equipment-list">
                            ${availableEquipment.length > 0 ? availableEquipment.map((equipment, index) => `
                                <div class="equipment-item available" data-equipment-index="${index}">
                                    <div class="item-icon">${equipment.icon}</div>
                                    <div class="item-info">
                                        <div class="item-name" style="color: ${equipment.getRarityColor()}">${equipment.name}</div>
                                        <div class="item-main-affix">主词条: ${equipment.mainAffix}</div>
                                        <div class="item-sub-affixes">
                                            ${equipment.subAffixes.map(affix => 
                                                `<div class="sub-affix" style="color: ${this.getAffixRarityColor(affix.rarity)}">副词条-${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value}</div>`
                                            ).join('')}
                                        </div>
                                    </div>
                                    <div class="item-action">
                                        <button class="equip-btn">装备</button>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="no-equipment">背包中没有${targetEquipmentType}类装备</div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 触发淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
        
        // 绑定关闭事件
        modal.querySelector('.close-equipment-selection-btn').addEventListener('click', () => {
            this.closeEquipmentSelection(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEquipmentSelection(modal);
            }
        });
        
        // 绑定卸下装备事件
        const unequipBtn = modal.querySelector('.unequip-btn');
        if (unequipBtn) {
            unequipBtn.addEventListener('click', () => {
                this.unequipItem(character, slotType);
                this.closeEquipmentSelection(modal);
                // 刷新角色详情面板
                this.refreshCharacterDetail(character);
            });
        }
        
        // 绑定装备事件
        modal.querySelectorAll('.equip-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const equipment = availableEquipment[index];
                this.equipItemToSlot(character, equipment, slotType);
                this.closeEquipmentSelection(modal);
                // 刷新角色详情面板
                this.refreshCharacterDetail(character);
            });
        });
    }
    
    // 关闭装备选择面板
    closeEquipmentSelection(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    // 装备物品到指定槽位
    equipItemToSlot(character, equipment, slotType) {
        // 如果槽位已有装备，先卸下
        if (character.equipment[slotType]) {
            this.inventory.push(character.equipment[slotType]);
        }
        
        // 装备新物品
        character.equipment[slotType] = equipment;
        
        // 从背包中移除
        const itemIndex = this.inventory.indexOf(equipment);
        if (itemIndex !== -1) {
            this.inventory.splice(itemIndex, 1);
        }
        
        // 重新计算角色属性
        character.updateAttributes();
        
        console.log(`${character.getDisplayName()} 装备了 ${equipment.name} 到 ${slotType} 槽位`);
    }
    
    // 卸下装备
    unequipItem(character, slotType) {
        const equipment = character.equipment[slotType];
        if (equipment) {
            // 将装备放回背包
            this.inventory.push(equipment);
            
            // 清空槽位
            character.equipment[slotType] = null;
            
            // 重新计算角色属性
            character.updateAttributes();
            
            console.log(`${character.getDisplayName()} 卸下了 ${equipment.name}`);
        }
    }
    
    // 刷新角色详情面板
    refreshCharacterDetail(character) {
        // 关闭当前面板
        const currentModal = document.querySelector('.character-detail-modal');
        if (currentModal) {
            currentModal.remove();
        }
        
        // 重新显示面板
        setTimeout(() => {
            this.showCharacterDetail(character);
        }, 100);
    }
    
    // 跳转到孵化师界面并显示指定蛋的详细信息
    jumpToIncubatorWithEgg(targetEgg) {
        // 切换到孵化师角色
        this.switchCharacter('incubator');
        
        // 找到目标蛋在蛋列表中的索引
        const eggs = this.inventory.filter(item => item.type === '蛋');
        const targetEggIndex = eggs.findIndex(egg => egg === targetEgg);
        
        if (targetEggIndex !== -1) {
            // 设置当前蛋页面为包含目标蛋的页面
            const eggsPerPage = 1; // 孵化师界面每页显示1个蛋
            this.currentEggPage = targetEggIndex;
            
            // 刷新界面以显示目标蛋
            this.initCharacterPanel();
            
            console.log(`跳转到孵化师界面，显示蛋: ${targetEgg.name} (索引: ${targetEggIndex})`);
        } else {
            console.error('未找到目标蛋');
        }
    }
    
    // 跳转到孵化师界面并显示食物选择
    jumpToIncubatorWithEggAndShowFeeding(targetEgg) {
        // 切换到孵化师角色
        this.switchCharacter('incubator');
        
        // 找到目标蛋在蛋列表中的索引
        const eggs = this.inventory.filter(item => item.type === '蛋');
        const targetEggIndex = eggs.findIndex(egg => egg === targetEgg);
        
        if (targetEggIndex !== -1) {
            // 设置当前蛋页面为包含目标蛋的页面
            this.currentEggPage = targetEggIndex;
            
            // 刷新界面以显示目标蛋
            this.initCharacterPanel();
            
            // 延迟显示食物选择区域，确保界面已经渲染完成
            setTimeout(() => {
                this.toggleFeedingSection(targetEgg);
            }, 100);
            
            console.log(`跳转到孵化师界面并显示食物选择，蛋: ${targetEgg.name} (索引: ${targetEggIndex})`);
        } else {
            console.error('未找到目标蛋');
        }
    }
    
    // 显示蛋详情（简化版，用于仓库中的蛋）
    showEggDetail(egg) {
        // 创建简单的蛋信息弹窗
        const modal = document.createElement('div');
        modal.className = 'character-detail-modal';
        modal.innerHTML = `
            <div class="character-detail-panel">
                <div class="character-detail-header">
                    <div class="character-detail-title">🥚 蛋详情</div>
                    <button class="close-detail-btn">×</button>
                </div>
                
                <div class="character-detail-content">
                    <div class="character-detail-info">
                        <div class="character-detail-avatar">${egg.icon}</div>
                        <div class="character-detail-name">${egg.name}</div>
                        <div class="character-detail-meta">
                            <span class="character-level">${egg.description}</span>
                            <span class="character-profession">${egg.rarity}</span>
                        </div>
                    </div>
                    
                    <div class="egg-attributes">
                        <div class="section-title">蛋属性</div>
                        <div class="egg-attr-item">
                            <span class="attr-name">🍽️ 饱腹（喂满时即可孵化）</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.satiety.current / egg.attributes.satiety.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.satiety.current}/${egg.attributes.satiety.max}</span>
                        </div>
                        <div class="egg-attr-item">
                            <span class="attr-name">💪 强壮（影响角色的力量）</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.strength.current / egg.attributes.strength.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.strength.current}/${egg.attributes.strength.max}</span>
                        </div>
                        <div class="egg-attr-item">
                            <span class="attr-name">⚡ 活力（影响角色的敏捷）</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.vitality.current / egg.attributes.vitality.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.vitality.current}/${egg.attributes.vitality.max}</span>
                        </div>
                        <div class="egg-attr-item">
                            <span class="attr-name">🧠 机灵（影响角色的智慧）</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.cleverness.current / egg.attributes.cleverness.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.cleverness.current}/${egg.attributes.cleverness.max}</span>
                        </div>
                        <div class="egg-attr-item">
                            <span class="attr-name">🔮 悟性（影响角色的技巧）</span>
                            <div class="attr-bar">
                                <div class="attr-fill" style="width: ${(egg.attributes.wisdom.current / egg.attributes.wisdom.max) * 100}%"></div>
                            </div>
                            <span class="attr-text">${egg.attributes.wisdom.current}/${egg.attributes.wisdom.max}</span>
                        </div>
                    </div>
                    
                    <div class="egg-actions">
                        ${(egg.canHatch && egg.canHatch()) ? '<button class="egg-btn hatch-btn">🐣 孵化</button>' : '<button class="egg-btn hatch-btn" disabled>🥚 未就绪</button>'}
                        <button class="egg-btn discard-btn">🗑️ 丢弃</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 触发淡入动画
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
        
        // 绑定关闭事件
        modal.querySelector('.close-detail-btn').addEventListener('click', () => {
            this.closeCharacterDetail(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCharacterDetail(modal);
            }
        });
        
        // 绑定蛋操作事件
        this.bindEggDetailEvents(modal, egg);
        
        console.log('显示蛋详情:', egg.name);
    }
    
    // 绑定蛋详情事件
    bindEggDetailEvents(modal, egg) {
        const hatchBtn = modal.querySelector('.hatch-btn');
        const discardBtn = modal.querySelector('.discard-btn');
        
        if (hatchBtn && !hatchBtn.disabled) {
            hatchBtn.addEventListener('click', () => {
                this.hatchedEgg = egg;
                const newCharacter = egg.hatch();
                if (newCharacter) {
                    this.closeCharacterDetail(modal);
                    this.showHatchedCharacter(newCharacter);
                    // 从背包中移除这个特定的蛋
                    const eggIndex = this.inventory.indexOf(egg);
                    if (eggIndex > -1) {
                        this.inventory.splice(eggIndex, 1);
                    }
                    this.initCharacterPanel(); // 刷新UI
                }
            });
        }
        
        if (discardBtn) {
            discardBtn.addEventListener('click', () => {
                this.closeCharacterDetail(modal);
                this.showDiscardConfirmation(egg);
            });
        }
    }
    
    // 关闭角色详情面板
    closeCharacterDetail(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    // 显示移除角色确认对话框
    showRemoveCharacterConfirmation(character, detailModal) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'remove-character-modal';
        confirmModal.innerHTML = `
            <div class="remove-character-panel">
                <div class="remove-character-header">
                    <div class="remove-character-title">⚠️ 确认移除角色</div>
                </div>
                
                <div class="remove-character-content">
                    <div class="character-info">
                        <div class="character-avatar">${character.avatar}</div>
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-level">等级 ${character.level}</div>
                    </div>
                    
                    <div class="warning-text">
                        <p>⚠️ 您确定要永久移除这个角色吗？</p>
                        <p>此操作无法撤销，角色的所有数据将被永久删除。</p>
                    </div>
                    
                    <div class="confirmation-buttons">
                        <button class="cancel-remove-btn">取消</button>
                        <button class="confirm-remove-btn">确认移除</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        
        // 触发淡入动画
        setTimeout(() => {
            confirmModal.classList.add('fade-in');
        }, 10);
        
        // 绑定事件
        const cancelBtn = confirmModal.querySelector('.cancel-remove-btn');
        const confirmBtn = confirmModal.querySelector('.confirm-remove-btn');
        
        cancelBtn.addEventListener('click', () => {
            this.closeRemoveConfirmation(confirmModal);
        });
        
        confirmBtn.addEventListener('click', () => {
            this.removeCharacter(character);
            this.closeRemoveConfirmation(confirmModal);
            this.closeCharacterDetail(detailModal);
        });
        
        // 点击背景关闭
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                this.closeRemoveConfirmation(confirmModal);
            }
        });
    }
    
    // 关闭移除确认对话框
    closeRemoveConfirmation(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    // 移除角色
    removeCharacter(character) {
        try {
            // 从背包中移除
            const inventoryIndex = this.inventory.indexOf(character);
            if (inventoryIndex > -1) {
                this.inventory.splice(inventoryIndex, 1);
                console.log(`从背包中移除角色: ${character.getDisplayName()}`);
            }
            
            // 从编队中移除
            const teamIndex = this.battleTeam.indexOf(character);
            if (teamIndex > -1) {
                this.battleTeam[teamIndex] = null;
                console.log(`从编队中移除角色: ${character.getDisplayName()}`);
            }
            
            // 刷新相关UI
            this.refreshCurrentPanel();
            this.updateTeamDisplay();
            
            // 显示移除成功提示
            this.showRemoveSuccessEffect(character.getDisplayName());
            
            console.log(`角色 ${character.getDisplayName()} 已被永久移除`);
            
        } catch (error) {
            console.error('移除角色时发生错误:', error);
        }
    }
    
    // 显示移除成功效果
    showRemoveSuccessEffect(characterName) {
        const effect = document.createElement('div');
        effect.className = 'remove-success-effect';
        effect.innerHTML = `🗑️ ${characterName} 已被移除`;
        
        document.body.appendChild(effect);
        
        // 2.5秒后移除效果
        setTimeout(() => {
            if (document.body.contains(effect)) {
                document.body.removeChild(effect);
            }
        }, 2500);
    }
    
    // 初始化金币显示
    initGoldDisplay() {
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer) return;
        
        const goldDisplay = document.createElement('div');
        goldDisplay.className = 'gold-display';
        goldDisplay.innerHTML = `
            <span class="gold-icon">💰</span>
            <span class="gold-amount">${this.gold}</span>
        `;
        
        navContainer.appendChild(goldDisplay);
    }
    
    // 更新金币显示
    updateGoldDisplay() {
        const goldAmount = document.querySelector('.gold-amount');
        if (goldAmount) {
            goldAmount.textContent = this.gold;
        }
    }
    
    // 购买物品
    buyItem(itemPreset, price) {
        if (this.gold >= price) {
            this.gold -= price;
            
            // 根据物品类型创建对应的物品
            let item;
            if (itemPreset.type === '蛋') {
                // 特殊处理：购买脏兮兮的蛋时，10%概率变成光滑的蛋
                if (itemPreset.name === '脏兮兮的蛋' && Math.random() < 0.1) {
                    const smoothEggPreset = ItemPresets.getPreset('smooth_egg');
                    item = new Egg(smoothEggPreset);
                    
                    // 显示特殊提示
                    this.showFloatingText('这颗蛋好像怪怪的？', this.canvas.width / 2, this.canvas.height / 2, '#FFD700', 2000);
                    console.log('🎉 幸运！脏兮兮的蛋变成了光滑的蛋！');
                } else {
                    item = new Egg(itemPreset);
                }
            } else {
                item = new Item(itemPreset);
            }
            
            this.inventory.push(item);
            this.updateGoldDisplay();
            
            // 更新收集任务进度
            this.updateQuestProgress('collect', { itemName: item.name, count: 1 });
            
            console.log(`购买成功: ${item.name}，剩余金币: ${this.gold}`);
            return true;
        } else {
            console.log(`金币不足，需要 ${price}，当前只有 ${this.gold}`);
            return false;
        }
    }
    
    // 创建商人UI
    createMerchantUI(container, character) {
        const shopItems = [
            {
                preset: ItemPresets.getPreset('dirty_egg'),
                canAfford: this.gold >= ItemPresets.getPreset('dirty_egg').buyPrice,
                ownedCount: this.getItemCount('dirty_egg')
            },
            {
                preset: ItemPresets.getPreset('rice'),
                canAfford: this.gold >= ItemPresets.getPreset('rice').buyPrice,
                ownedCount: this.getItemCount('rice')
            },
            {
                preset: ItemPresets.getPreset('milk'),
                canAfford: this.gold >= ItemPresets.getPreset('milk').buyPrice,
                ownedCount: this.getItemCount('milk')
            },
            {
                preset: ItemPresets.getPreset('tomato'),
                canAfford: this.gold >= ItemPresets.getPreset('tomato').buyPrice,
                ownedCount: this.getItemCount('tomato')
            },
            {
                preset: ItemPresets.getPreset('chicken_leg'),
                canAfford: this.gold >= ItemPresets.getPreset('chicken_leg').buyPrice,
                ownedCount: this.getItemCount('chicken_leg')
            },
            {
                preset: ItemPresets.getPreset('tea'),
                canAfford: this.gold >= ItemPresets.getPreset('tea').buyPrice,
                ownedCount: this.getItemCount('tea')
            },
            {
                preset: ItemPresets.getPreset('bandage'),
                canAfford: this.gold >= ItemPresets.getPreset('bandage').buyPrice,
                ownedCount: this.getItemCount('bandage')
            },
            {
                preset: ItemPresets.getPreset('mana_capsule'),
                canAfford: this.gold >= ItemPresets.getPreset('mana_capsule').buyPrice,
                ownedCount: this.getItemCount('mana_capsule')
            },
            {
                preset: ItemPresets.getPreset('savage_charge_book'),
                canAfford: this.gold >= ItemPresets.getPreset('savage_charge_book').buyPrice,
                ownedCount: this.getItemCount('savage_charge_book')
            },
            {
                preset: ItemPresets.getPreset('heavy_punch_book'),
                canAfford: this.gold >= ItemPresets.getPreset('heavy_punch_book').buyPrice,
                ownedCount: this.getItemCount('heavy_punch_book')
            },
            {
                preset: ItemPresets.getPreset('emergency_bandage_book'),
                canAfford: this.gold >= ItemPresets.getPreset('emergency_bandage_book').buyPrice,
                ownedCount: this.getItemCount('emergency_bandage_book')
            },
            {
                preset: ItemPresets.getPreset('enrage_book'),
                canAfford: this.gold >= ItemPresets.getPreset('enrage_book').buyPrice,
                ownedCount: this.getItemCount('enrage_book')
            }
        ];
        
        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="merchant-shop">
                <div class="section-title">商店</div>
                <div class="shop-items-grid">
                    ${shopItems.map((shopItem, index) => this.createShopItemUI(shopItem, index)).join('')}
                </div>
            </div>
        `;
        
        // 绑定购买事件
        this.bindShopEvents(container);
    }
    
    // 获取物品拥有数量
    getItemCount(itemPresetName) {
        try {
            const preset = ItemPresets.getPreset(itemPresetName);
            if (!preset || !preset.name) {
                console.warn(`未找到物品预设: ${itemPresetName}`);
                return 0;
            }
            return this.inventory.filter(item => {
                // 根据物品名称匹配
                return item.name === preset.name;
            }).length;
        } catch (error) {
            console.error(`获取物品数量时出错: ${itemPresetName}`, error);
            return 0;
        }
    }
    
    // 创建商店物品UI
    createShopItemUI(shopItem, index) {
        const item = shopItem.preset;
        const canAfford = shopItem.canAfford;
        const ownedCount = shopItem.ownedCount;
        const itemObj = new Item(item);
        const isCommon = item.rarity === '普通';
        
        return `
            <div class="shop-item ${!canAfford ? 'disabled' : ''}" data-item-index="${index}">
                <div class="item-icon" style="filter: ${!canAfford ? 'grayscale(100%) brightness(0.5)' : 'none'}">${item.icon}</div>
                <div class="item-info">
                    <div class="item-name-container">
                        <span class="item-name ${isCommon ? 'common-rarity' : ''}" style="color: ${itemObj.getRarityColor()}">${item.name}</span>
                        ${ownedCount > 0 ? `<span class="owned-count">已拥有 ${ownedCount}</span>` : ''}
                    </div>
                    <div class="item-description">${item.description}</div>
                    <div class="item-price">
                        <span class="price-label">价格:</span>
                        <span class="price-value">💰 ${item.buyPrice}</span>
                    </div>
                </div>
                ${!canAfford ? '<div class="insufficient-funds">金币不足</div>' : ''}
            </div>
        `;
    }
    
    // 绑定商店事件
    bindShopEvents(container) {
        const shopItems = container.querySelectorAll('.shop-item');
        
        // 商品预设名称映射
        const itemPresetNames = ['dirty_egg', 'rice', 'milk', 'tomato', 'chicken_leg', 'tea', 'bandage', 'mana_capsule', 'savage_charge_book', 'heavy_punch_book', 'emergency_bandage_book', 'enrage_book'];
        
        shopItems.forEach((shopItemElement, index) => {
            // 移除之前的事件监听器（如果存在）
            const oldHandler = shopItemElement._clickHandler;
            if (oldHandler) {
                shopItemElement.removeEventListener('click', oldHandler);
            }
            
            // 只为可购买的商品绑定点击事件
            if (!shopItemElement.classList.contains('disabled')) {
                const clickHandler = () => {
                    const presetName = itemPresetNames[index];
                    const itemPreset = ItemPresets.getPreset(presetName);
                    const success = this.buyItem(itemPreset, itemPreset.buyPrice);
                    
                    if (success) {
                        // 添加购买成功视觉效果
                        this.showPurchaseSuccess(shopItemElement);
                        
                        // 只更新商店显示，不重新创建整个UI
                        this.updateShopDisplay(container);
                    }
                };
                
                // 保存事件处理器引用以便后续移除
                shopItemElement._clickHandler = clickHandler;
                shopItemElement.addEventListener('click', clickHandler);
            }
        });
    }
    
    // 更新商店显示（只更新必要部分）
    updateShopDisplay(container) {
        // 重新计算商品状态
        const shopItems = [
            {
                preset: ItemPresets.getPreset('dirty_egg'),
                canAfford: this.gold >= ItemPresets.getPreset('dirty_egg').buyPrice,
                ownedCount: this.getItemCount('dirty_egg')
            },
            {
                preset: ItemPresets.getPreset('rice'),
                canAfford: this.gold >= ItemPresets.getPreset('rice').buyPrice,
                ownedCount: this.getItemCount('rice')
            },
            {
                preset: ItemPresets.getPreset('milk'),
                canAfford: this.gold >= ItemPresets.getPreset('milk').buyPrice,
                ownedCount: this.getItemCount('milk')
            },
            {
                preset: ItemPresets.getPreset('tomato'),
                canAfford: this.gold >= ItemPresets.getPreset('tomato').buyPrice,
                ownedCount: this.getItemCount('tomato')
            },
            {
                preset: ItemPresets.getPreset('chicken_leg'),
                canAfford: this.gold >= ItemPresets.getPreset('chicken_leg').buyPrice,
                ownedCount: this.getItemCount('chicken_leg')
            },
            {
                preset: ItemPresets.getPreset('tea'),
                canAfford: this.gold >= ItemPresets.getPreset('tea').buyPrice,
                ownedCount: this.getItemCount('tea')
            },
            {
                preset: ItemPresets.getPreset('bandage'),
                canAfford: this.gold >= ItemPresets.getPreset('bandage').buyPrice,
                ownedCount: this.getItemCount('bandage')
            },
            {
                preset: ItemPresets.getPreset('mana_capsule'),
                canAfford: this.gold >= ItemPresets.getPreset('mana_capsule').buyPrice,
                ownedCount: this.getItemCount('mana_capsule')
            },
            {
                preset: ItemPresets.getPreset('savage_charge_book'),
                canAfford: this.gold >= ItemPresets.getPreset('savage_charge_book').buyPrice,
                ownedCount: this.getItemCount('savage_charge_book')
            },
            {
                preset: ItemPresets.getPreset('heavy_punch_book'),
                canAfford: this.gold >= ItemPresets.getPreset('heavy_punch_book').buyPrice,
                ownedCount: this.getItemCount('heavy_punch_book')
            },
            {
                preset: ItemPresets.getPreset('emergency_bandage_book'),
                canAfford: this.gold >= ItemPresets.getPreset('emergency_bandage_book').buyPrice,
                ownedCount: this.getItemCount('emergency_bandage_book')
            },
            {
                preset: ItemPresets.getPreset('enrage_book'),
                canAfford: this.gold >= ItemPresets.getPreset('enrage_book').buyPrice,
                ownedCount: this.getItemCount('enrage_book')
            }
        ];
        
        // 更新每个商品的显示状态
        const shopItemElements = container.querySelectorAll('.shop-item');
        shopItemElements.forEach((element, index) => {
            const shopItem = shopItems[index];
            const canAfford = shopItem.canAfford;
            const ownedCount = shopItem.ownedCount;
            
            // 更新商品可购买状态
            if (canAfford) {
                element.classList.remove('disabled');
                // 移除金币不足提示
                const insufficientFunds = element.querySelector('.insufficient-funds');
                if (insufficientFunds) {
                    insufficientFunds.remove();
                }
                // 恢复图标颜色
                const itemIcon = element.querySelector('.item-icon');
                if (itemIcon) {
                    itemIcon.style.filter = 'none';
                }
            } else {
                element.classList.add('disabled');
                // 添加金币不足提示
                if (!element.querySelector('.insufficient-funds')) {
                    const insufficientDiv = document.createElement('div');
                    insufficientDiv.className = 'insufficient-funds';
                    insufficientDiv.textContent = '金币不足';
                    element.appendChild(insufficientDiv);
                }
                // 灰化图标
                const itemIcon = element.querySelector('.item-icon');
                if (itemIcon) {
                    itemIcon.style.filter = 'grayscale(100%) brightness(0.5)';
                }
            }
            
            // 更新拥有数量显示
            const ownedCountElement = element.querySelector('.owned-count');
            if (ownedCount > 0) {
                if (ownedCountElement) {
                    ownedCountElement.textContent = `已拥有 ${ownedCount}`;
                } else {
                    // 创建拥有数量显示
                    const nameContainer = element.querySelector('.item-name-container');
                    if (nameContainer) {
                        const ownedSpan = document.createElement('span');
                        ownedSpan.className = 'owned-count';
                        ownedSpan.textContent = `已拥有 ${ownedCount}`;
                        nameContainer.appendChild(ownedSpan);
                    }
                }
            } else {
                if (ownedCountElement) {
                    ownedCountElement.remove();
                }
            }
        });
        
        // 重新绑定事件（只为新的可购买商品绑定）
        this.bindShopEvents(container);
    }
    
    // 显示购买成功效果
    showPurchaseSuccess(element) {
        // 获取商品图标元素
        const itemIcon = element.querySelector('.item-icon');
        
        if (itemIcon) {
            // 创建漂浮的商品头像
            const floatingIcon = document.createElement('div');
            floatingIcon.className = 'floating-purchase-icon';
            floatingIcon.textContent = itemIcon.textContent; // 复制图标内容
            
            // 获取原图标的位置
            const iconRect = itemIcon.getBoundingClientRect();
            const containerRect = element.getBoundingClientRect();
            
            // 设置漂浮图标的初始位置（相对于商品容器）
            floatingIcon.style.left = (iconRect.left - containerRect.left) + 'px';
            floatingIcon.style.top = (iconRect.top - containerRect.top) + 'px';
            
            // 添加到商品容器中
            element.style.position = 'relative';
            element.appendChild(floatingIcon);
            
            // 2秒后移除漂浮图标
            setTimeout(() => {
                if (floatingIcon.parentNode) {
                    floatingIcon.parentNode.removeChild(floatingIcon);
                }
            }, 2000);
        }
        
        // 创建成功提示
        const successIndicator = document.createElement('div');
        successIndicator.className = 'purchase-success-indicator';
        successIndicator.innerHTML = '✅ 购买成功!';
        element.appendChild(successIndicator);
        
        // 动画结束后移除成功提示
        setTimeout(() => {
            if (successIndicator.parentNode) {
                successIndicator.parentNode.removeChild(successIndicator);
            }
        }, 1000);
    }
    
    // 创建手艺人UI
    createCraftsmanUI(container, character) {
        // 制造配方
        const craftingRecipes = [
            {
                name: "铜剑",
                itemId: "copper_sword",
                materials: [
                    { name: "铜矿石", itemId: "copper_ore", count: 3 },
                    { name: "橡木材", itemId: "oak_wood", count: 1 }
                ],
                description: "基础的铜制武器"
            },
            {
                name: "铜盾牌",
                itemId: "copper_shield",
                materials: [
                    { name: "铜矿石", itemId: "copper_ore", count: 2 },
                    { name: "橡木材", itemId: "oak_wood", count: 2 }
                ],
                description: "基础的铜制盾牌"
            },
            {
                name: "铜甲护胸",
                itemId: "copper_chestplate",
                materials: [
                    { name: "铜矿石", itemId: "copper_ore", count: 4 }
                ],
                description: "基础的铜制护甲"
            },
            {
                name: "铜戒指",
                itemId: "copper_ring",
                materials: [
                    { name: "铜矿石", itemId: "copper_ore", count: 2 }
                ],
                description: "简单的铜制饰品"
            },
            {
                name: "香草药剂",
                itemId: "herb_potion",
                materials: [
                    { name: "香草叶", itemId: "herb_leaf", count: 3 }
                ],
                description: "可以用来恢复生命值"
            }
        ];

        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="npc-description">
                <div class="section-title">角色介绍</div>
                <div class="npc-info">
                    ${this.getNPCDescription(character.name)}
                </div>
            </div>
            
            <div class="crafting-panel">
                <div class="section-title">制造面板</div>
                <div class="crafting-recipes">
                    ${craftingRecipes.map(recipe => {
                        const canCraft = this.canCraftItem(recipe);
                        return `
                            <div class="crafting-recipe ${canCraft ? 'craftable' : 'not-craftable'}" data-recipe="${recipe.itemId}">
                                <div class="recipe-header">
                                    <div class="recipe-icon">${ItemPresets.getPreset(recipe.itemId).icon}</div>
                                    <div class="recipe-info">
                                        <div class="recipe-name">${this.getRecipeDisplayName(recipe)}</div>
                                        <div class="recipe-description">${recipe.description}</div>
                                    </div>
                                </div>
                                <div class="recipe-materials">
                                    <div class="materials-title">所需材料:</div>
                                    ${recipe.materials.map(material => {
                                        const owned = this.getItemCount(material.itemId);
                                        const hasEnough = owned >= material.count;
                                        return `
                                            <div class="material-item ${hasEnough ? 'sufficient' : 'insufficient'}">
                                                <span class="material-name">${material.name}</span>
                                                <span class="material-count">${owned}/${material.count}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                <div class="recipe-actions">
                                    <button class="craft-button ${canCraft ? '' : 'disabled'}" 
                                            onclick="game.craftItem('${recipe.itemId}')" 
                                            ${canCraft ? '' : 'disabled'}>
                                        ${canCraft ? '制造' : '材料不足'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // 获取制造配方显示名称（包含主词条信息）
    getRecipeDisplayName(recipe) {
        const itemPreset = ItemPresets.getPreset(recipe.itemId);
        if (itemPreset && itemPreset.equipmentType && itemPreset.mainAffix) {
            return `${recipe.name}(${itemPreset.mainAffix})`;
        }
        return recipe.name;
    }
    
    // 检查是否可以制造物品
    canCraftItem(recipe) {
        return recipe.materials.every(material => {
            const owned = this.getItemCount(material.itemId);
            return owned >= material.count;
        });
    }
    
    // 制造物品
    craftItem(itemId) {
        const craftingRecipes = [
            {
                name: "铜剑",
                itemId: "copper_sword",
                materials: [
                    { name: "铜矿石", itemId: "copper_ore", count: 3 },
                    { name: "橡木材", itemId: "oak_wood", count: 1 }
                ]
            },
            {
                name: "铜盾牌",
                itemId: "copper_shield",
                materials: [
                    { name: "铜矿石", itemId: "copper_ore", count: 2 },
                    { name: "橡木材", itemId: "oak_wood", count: 2 }
                ]
            },
            {
                name: "铜甲护胸",
                itemId: "copper_chestplate",
                materials: [
                    { name: "铜矿石", itemId: "copper_ore", count: 4 }
                ]
            },
            {
                name: "铜戒指",
                itemId: "copper_ring",
                materials: [
                    { name: "铜矿石", itemId: "copper_ore", count: 2 }
                ]
            },
            {
                name: "香草药剂",
                itemId: "herb_potion",
                materials: [
                    { name: "香草叶", itemId: "herb_leaf", count: 3 }
                ]
            }
        ];

        const recipe = craftingRecipes.find(r => r.itemId === itemId);
        if (!recipe) {
            console.log('未找到制造配方');
            return;
        }

        // 检查材料是否足够
        if (!this.canCraftItem(recipe)) {
            console.log('材料不足，无法制造');
            return;
        }

        // 消耗材料
        recipe.materials.forEach(material => {
            this.removeItemsFromInventory(material.itemId, material.count);
        });

        // 添加制造的物品
        const itemData = ItemPresets.getPreset(itemId);
        const item = new Item(itemData);
        
        // 如果是装备类物品，有10%概率成为匠心巨制
        if (item.type === "装备" && Math.random() < 0.1) {
            this.createMasterworkEquipment(item);
        }
        
        this.inventory.push(item);

        console.log(`成功制造了 ${recipe.name}`);
        
        // 显示制造成功面板
        this.showCraftingSuccessPanel(item);
        
        // 刷新制造面板
        if (this.currentCharacter && this.currentCharacter.name === '手艺人') {
            const container = document.getElementById('characterPanel');
            if (container) {
                this.createCraftsmanUI(container, this.currentCharacter);
            }
        }
    }
    
    // 创建厨子UI
    createChefUI(container, character) {
        // 烹饪配方
        const cookingRecipes = [
            {
                name: "烤鱼",
                itemId: "grilled_fish",
                materials: [
                    { name: "鱼", itemId: "fish", count: 2 }
                ],
                description: "美味的烤鱼"
            },
            {
                name: "蔬菜炖肉",
                itemId: "vegetable_stew",
                materials: [
                    { name: "胡萝卜", itemId: "carrot", count: 2 },
                    { name: "土豆", itemId: "potato", count: 2 },
                    { name: "鸡腿", itemId: "chicken_leg", count: 1 }
                ],
                description: "营养丰富的炖菜"
            },
            {
                name: "蘑菇汤",
                itemId: "mushroom_soup",
                materials: [
                    { name: "蘑菇", itemId: "mushroom", count: 3 },
                    { name: "牛奶", itemId: "milk", count: 1 }
                ],
                description: "香浓的蘑菇汤"
            },
            {
                name: "烤鸡",
                itemId: "roasted_chicken",
                materials: [
                    { name: "鸡腿", itemId: "chicken_leg", count: 3 }
                ],
                description: "金黄酥脆的烤鸡"
            },
            {
                name: "水果沙拉",
                itemId: "fruit_salad",
                materials: [
                    { name: "番茄", itemId: "tomato", count: 2 },
                    { name: "香蕉", itemId: "banana", count: 1 }
                ],
                description: "新鲜的水果沙拉"
            },
            {
                name: "海鲜拼盘",
                itemId: "seafood_platter",
                materials: [
                    { name: "鱼", itemId: "fish", count: 5 },
                    { name: "牛奶", itemId: "milk", count: 2 }
                ],
                description: "豪华的海鲜大餐"
            },
            {
                name: "高级牛排",
                itemId: "premium_steak",
                materials: [
                    { name: "肉排", itemId: "steak", count: 3 }
                ],
                description: "完美烹制的牛排"
            },
            {
                name: "皇家盛宴",
                itemId: "royal_feast",
                materials: [
                    { name: "肉排", itemId: "steak", count: 2 },
                    { name: "鱼", itemId: "fish", count: 2 },
                    { name: "鸡腿", itemId: "chicken_leg", count: 2 },
                    { name: "牛奶", itemId: "milk", count: 1 }
                ],
                description: "奢华的皇家料理"
            },
            {
                name: "龙肉火锅",
                itemId: "dragon_hotpot",
                materials: [
                    { name: "肉排", itemId: "steak", count: 5 },
                    { name: "蘑菇", itemId: "mushroom", count: 3 },
                    { name: "胡萝卜", itemId: "carrot", count: 3 },
                    { name: "土豆", itemId: "potato", count: 3 }
                ],
                description: "传说中的龙肉料理"
            },
            {
                name: "魔法蛋糕",
                itemId: "magic_cake",
                materials: [
                    { name: "牛奶", itemId: "milk", count: 2 },
                    { name: "香蕉", itemId: "banana", count: 2 },
                    { name: "冰淇淋", itemId: "ice_cream", count: 1 }
                ],
                description: "充满魔力的甜点"
            }
        ];

        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="npc-description">
                <div class="section-title">角色介绍</div>
                <div class="npc-info">
                    ${this.getNPCDescription(character.name)}
                </div>
            </div>
            
            <div class="cooking-panel">
                <div class="section-title">🍳 烹饪面板</div>
                <div class="cooking-recipes">
                    ${cookingRecipes.map(recipe => {
                        const canCook = this.canCraftItem(recipe);
                        const itemPreset = ItemPresets.getPreset(recipe.itemId);
                        return `
                            <div class="cooking-recipe ${canCook ? 'cookable' : 'not-cookable'}" data-recipe="${recipe.itemId}">
                                <div class="recipe-header">
                                    <div class="recipe-icon">${itemPreset.icon}</div>
                                    <div class="recipe-info">
                                        <div class="recipe-name">${recipe.name}</div>
                                        <div class="recipe-rarity rarity-${itemPreset.rarity}">${itemPreset.rarity}</div>
                                        <div class="recipe-description">${recipe.description}</div>
                                        <div class="recipe-effect">${itemPreset.effect}</div>
                                    </div>
                                </div>
                                <div class="recipe-materials">
                                    <div class="materials-title">所需食材:</div>
                                    ${recipe.materials.map(material => {
                                        const owned = this.getItemCount(material.itemId);
                                        const hasEnough = owned >= material.count;
                                        return `
                                            <div class="material-item ${hasEnough ? 'sufficient' : 'insufficient'}">
                                                <span class="material-name">${material.name}</span>
                                                <span class="material-count">${owned}/${material.count}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                <div class="recipe-actions">
                                    <button class="cook-button ${canCook ? '' : 'disabled'}" 
                                            onclick="game.cookCuisine('${recipe.itemId}')" 
                                            ${canCook ? '' : 'disabled'}>
                                        ${canCook ? '烹饪' : '食材不足'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // 烹饪菜肴
    cookCuisine(itemId) {
        try {
            const cookingRecipes = [
                {
                    name: "烤鱼",
                    itemId: "grilled_fish",
                    materials: [
                        { name: "鱼", itemId: "fish", count: 2 }
                    ]
                },
                {
                    name: "蔬菜炖肉",
                    itemId: "vegetable_stew",
                    materials: [
                        { name: "胡萝卜", itemId: "carrot", count: 2 },
                        { name: "土豆", itemId: "potato", count: 2 },
                        { name: "鸡腿", itemId: "chicken_leg", count: 1 }
                    ]
                },
                {
                    name: "蘑菇汤",
                    itemId: "mushroom_soup",
                    materials: [
                        { name: "蘑菇", itemId: "mushroom", count: 3 },
                        { name: "牛奶", itemId: "milk", count: 1 }
                    ]
                },
                {
                    name: "烤鸡",
                    itemId: "roasted_chicken",
                    materials: [
                        { name: "鸡腿", itemId: "chicken_leg", count: 3 }
                    ]
                },
                {
                    name: "水果沙拉",
                    itemId: "fruit_salad",
                    materials: [
                        { name: "番茄", itemId: "tomato", count: 2 },
                        { name: "香蕉", itemId: "banana", count: 1 }
                    ]
                },
                {
                    name: "海鲜拼盘",
                    itemId: "seafood_platter",
                    materials: [
                        { name: "鱼", itemId: "fish", count: 5 },
                        { name: "牛奶", itemId: "milk", count: 2 }
                    ]
                },
                {
                    name: "高级牛排",
                    itemId: "premium_steak",
                    materials: [
                        { name: "肉排", itemId: "steak", count: 3 }
                    ]
                },
                {
                    name: "皇家盛宴",
                    itemId: "royal_feast",
                    materials: [
                        { name: "肉排", itemId: "steak", count: 2 },
                        { name: "鱼", itemId: "fish", count: 2 },
                        { name: "鸡腿", itemId: "chicken_leg", count: 2 },
                        { name: "牛奶", itemId: "milk", count: 1 }
                    ]
                },
                {
                    name: "龙肉火锅",
                    itemId: "dragon_hotpot",
                    materials: [
                        { name: "肉排", itemId: "steak", count: 5 },
                        { name: "蘑菇", itemId: "mushroom", count: 3 },
                        { name: "胡萝卜", itemId: "carrot", count: 3 },
                        { name: "土豆", itemId: "potato", count: 3 }
                    ]
                },
                {
                    name: "魔法蛋糕",
                    itemId: "magic_cake",
                    materials: [
                        { name: "牛奶", itemId: "milk", count: 2 },
                        { name: "香蕉", itemId: "banana", count: 2 },
                        { name: "冰淇淋", itemId: "ice_cream", count: 1 }
                    ]
                }
            ];
            
            const recipe = cookingRecipes.find(r => r.itemId === itemId);
            if (!recipe) {
                console.error(`未找到烹饪配方: ${itemId}`);
                return;
            }
            
            // 检查材料是否足够
            if (!this.canCraftItem(recipe)) {
                console.log('食材不足，无法烹饪');
                return;
            }
            
            // 消耗材料
            recipe.materials.forEach(material => {
                this.removeItemsFromInventory(material.itemId, material.count);
            });
            
            // 创建菜肴
            const item = new Item(ItemPresets.getPreset(itemId));
            this.inventory.push(item);

            console.log(`成功烹饪了 ${recipe.name}`);
            
            // 显示烹饪成功面板
            this.showCookingSuccessPanel(item);
            
            // 刷新烹饪面板
            if (this.currentCharacter && this.currentCharacter.name === '厨子') {
                const container = document.getElementById('characterPanel');
                if (container) {
                    this.createChefUI(container, this.currentCharacter);
                }
            }
        } catch (error) {
            console.error('烹饪时发生错误:', error);
            alert('烹饪失败，请查看控制台了解详情');
        }
    }
    
    // 显示烹饪成功面板
    showCookingSuccessPanel(item) {
        // 创建成功面板
        const successPanel = document.createElement('div');
        successPanel.className = 'cooking-success-panel';
        successPanel.innerHTML = `
            <div class="success-content">
                <div class="success-title">🎉 烹饪成功！</div>
                <div class="success-item">
                    <div class="item-icon-large">${item.icon}</div>
                    <div class="item-name-large">${item.name}</div>
                    <div class="item-rarity rarity-${item.rarity}">${item.rarity}</div>
                    <div class="item-effect">${item.effect}</div>
                </div>
                <button class="close-success-btn" onclick="this.parentElement.parentElement.remove()">确定</button>
            </div>
        `;
        
        document.body.appendChild(successPanel);
        
        // 3秒后自动关闭
        setTimeout(() => {
            if (successPanel.parentNode) {
                successPanel.remove();
            }
        }, 3000);
    }
    
    // 创建农夫UI
    createFarmerUI(container, character) {
        // 清除之前的定时器
        if (this.farmRefreshTimer) {
            clearInterval(this.farmRefreshTimer);
            this.farmRefreshTimer = null;
        }
        
        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="npc-description">
                <div class="section-title">角色介绍</div>
                <div class="npc-info">
                    ${this.getNPCDescription(character.name)}
                </div>
            </div>
            
            <div class="farmer-tabs">
                <button class="farmer-tab active" data-tab="shop">🛒 种子商店</button>
                <button class="farmer-tab" data-tab="farm">🌾 种植界面</button>
            </div>
            
            <div class="farmer-content">
                <div id="farmerShopTab" class="farmer-tab-content active">
                    ${this.createSeedShopHTML()}
                </div>
                <div id="farmerFarmTab" class="farmer-tab-content">
                    ${this.createFarmPlotsHTML()}
                </div>
            </div>
        `;
        
        // 绑定标签页切换事件
        const tabs = container.querySelectorAll('.farmer-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // 更新标签页激活状态
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 更新内容显示
                const shopTab = container.querySelector('#farmerShopTab');
                const farmTab = container.querySelector('#farmerFarmTab');
                
                if (tabName === 'shop') {
                    shopTab.classList.add('active');
                    farmTab.classList.remove('active');
                    // 停止定时刷新
                    if (this.farmRefreshTimer) {
                        clearInterval(this.farmRefreshTimer);
                        this.farmRefreshTimer = null;
                    }
                } else {
                    shopTab.classList.remove('active');
                    farmTab.classList.add('active');
                    // 刷新种植界面
                    farmTab.innerHTML = this.createFarmPlotsHTML();
                    // 启动定时刷新（每秒更新一次）
                    this.startFarmRefreshTimer(farmTab);
                }
            });
        });
        
        // 绑定种子商店事件
        this.bindSeedShopEvents(container);
    }
    
    // 启动农场刷新定时器
    startFarmRefreshTimer(farmTab) {
        // 清除之前的定时器
        if (this.farmRefreshTimer) {
            clearInterval(this.farmRefreshTimer);
        }
        
        // 每秒刷新一次种植界面
        this.farmRefreshTimer = setInterval(() => {
            if (farmTab && farmTab.classList.contains('active')) {
                farmTab.innerHTML = this.createFarmPlotsHTML();
            } else {
                // 如果标签页不再激活，停止定时器
                clearInterval(this.farmRefreshTimer);
                this.farmRefreshTimer = null;
            }
        }, 1000);
    }
    
    // 创建种子商店HTML
    createSeedShopHTML() {
        const seedIds = ['carrot_seed', 'potato_seed', 'fish_seed', 'mushroom_seed', 'tomato_seed', 'banana_seed', 'tea_seed'];
        const seeds = seedIds.map(id => ({
            id: id,
            preset: ItemPresets.getPreset(id)
        }));
        
        return `
            <div class="seed-shop">
                <div class="section-title">🌱 种子商店</div>
                <div class="seed-list">
                    ${seeds.map(seed => {
                        const canAfford = this.gold >= seed.preset.buyPrice;
                        const ownedCount = this.getItemCount(seed.id);
                        return `
                            <div class="seed-item ${canAfford ? '' : 'disabled'}" data-seed-id="${seed.id}">
                                <div class="seed-icon">${seed.preset.icon}</div>
                                <div class="seed-info">
                                    <div class="seed-name">${seed.preset.name}</div>
                                    <div class="seed-description">${seed.preset.description}</div>
                                    <div class="seed-effect">${seed.preset.effect}</div>
                                    <div class="seed-price">💰 ${seed.preset.buyPrice} 金币</div>
                                    ${ownedCount > 0 ? `<div class="seed-owned">已拥有: ${ownedCount}</div>` : ''}
                                </div>
                                <button class="buy-seed-btn ${canAfford ? '' : 'disabled'}" 
                                        onclick="game.buySeed('${seed.id}')" 
                                        ${canAfford ? '' : 'disabled'}>
                                    ${canAfford ? '购买' : '金币不足'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // 创建种植界面HTML
    createFarmPlotsHTML() {
        return `
            <div class="farm-plots">
                <div class="section-title">🌾 种植界面 (${this.farmPlots.filter(p => p.seedId).length}/10)</div>
                <div class="plots-grid">
                    ${this.farmPlots.map(plot => this.createPlotHTML(plot)).join('')}
                </div>
            </div>
        `;
    }
    
    // 创建单个种植槽HTML
    createPlotHTML(plot) {
        if (!plot.seedId) {
            // 空槽位
            return `
                <div class="farm-plot empty" data-plot-id="${plot.id}">
                    <div class="plot-icon">🌱</div>
                    <div class="plot-status">空闲</div>
                    <button class="plant-btn" onclick="game.showSeedSelector(${plot.id})">种植</button>
                </div>
            `;
        } else {
            // 有作物的槽位
            const now = Date.now();
            const elapsed = (now - plot.plantTime) / 1000; // 秒
            const remaining = Math.max(0, plot.growthDuration - elapsed); // 剩余秒数
            const progress = Math.min(100, (elapsed / plot.growthDuration) * 100);
            const isReady = elapsed >= plot.growthDuration;
            
            // 格式化倒计时
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            const countdown = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // 使用作物图标而不是种子图标
            const cropIcon = plot.seedPreset.cropIcon || plot.seedPreset.icon;
            
            return `
                <div class="farm-plot ${isReady ? 'ready' : 'growing'}" data-plot-id="${plot.id}">
                    <div class="plot-icon">${cropIcon}</div>
                    <div class="plot-name">${plot.seedPreset.name.replace('种子', '').replace('种', '').replace('苗', '').replace('孢子', '')}</div>
                    <div class="plot-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        ${isReady ? 
                            '<div class="progress-text ready-text">✅ 已成熟</div>' :
                            `<div class="progress-text countdown-text">⏱️ ${countdown}</div>`
                        }
                    </div>
                    <div class="plot-actions">
                        ${isReady ? 
                            `<button class="harvest-btn" onclick="game.harvestCrop(${plot.id})">收获</button>` :
                            `<button class="growing-btn" disabled>生长中</button>`
                        }
                        ${!isReady ? 
                            `<button class="remove-btn-small" onclick="game.removeCrop(${plot.id})">铲除</button>` :
                            ''
                        }
                    </div>
                </div>
            `;
        }
    }
    
    // 购买种子
    buySeed(seedId) {
        const seed = ItemPresets.getPreset(seedId);
        if (!seed) return;
        
        if (this.gold >= seed.buyPrice) {
            this.gold -= seed.buyPrice;
            const item = new Item(seed);
            // 为种子添加预设ID，方便后续使用
            item.presetId = seedId;
            this.inventory.push(item);
            
            console.log(`购买了 ${seed.name}`);
            
            // 显示购买成功的视觉效果
            this.showPurchaseSuccessEffect(seedId, seed);
            
            // 刷新农夫UI
            if (this.currentCharacter && this.currentCharacter.name === '农夫') {
                const container = document.getElementById('characterPanel');
                if (container) {
                    this.createFarmerUI(container, this.currentCharacter);
                }
            }
        }
    }
    
    // 显示购买成功的视觉效果
    showPurchaseSuccessEffect(seedId, seed) {
        // 找到被点击的种子卡片
        const seedCard = document.querySelector(`.seed-item[data-seed-id="${seedId}"]`);
        if (!seedCard) return;
        
        const seedIcon = seedCard.querySelector('.seed-icon');
        if (!seedIcon) return;
        
        // 获取种子图标的位置
        const iconRect = seedIcon.getBoundingClientRect();
        
        // 创建飞行的种子图标
        const flyingIcon = document.createElement('div');
        flyingIcon.className = 'flying-seed-icon';
        flyingIcon.textContent = seed.icon;
        flyingIcon.style.left = iconRect.left + 'px';
        flyingIcon.style.top = iconRect.top + 'px';
        document.body.appendChild(flyingIcon);
        
        // 触发飞行动画（飞向右上角，模拟飞向背包）
        setTimeout(() => {
            flyingIcon.style.transform = 'translate(200px, -200px) scale(0.3)';
            flyingIcon.style.opacity = '0';
        }, 10);
        
        // 动画结束后移除元素
        setTimeout(() => {
            flyingIcon.remove();
        }, 600);
        
        // 显示金币减少动画
        const goldText = document.createElement('div');
        goldText.className = 'gold-change-text';
        goldText.textContent = `-${seed.buyPrice} 💰`;
        goldText.style.left = iconRect.left + iconRect.width / 2 + 'px';
        goldText.style.top = iconRect.top + 'px';
        document.body.appendChild(goldText);
        
        setTimeout(() => {
            goldText.style.transform = 'translateY(-50px)';
            goldText.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            goldText.remove();
        }, 800);
        
        // 显示成功提示文字
        const successText = document.createElement('div');
        successText.className = 'purchase-success-text';
        successText.textContent = `✓ 购买成功！`;
        successText.style.left = iconRect.left + iconRect.width / 2 + 'px';
        successText.style.top = iconRect.bottom + 10 + 'px';
        document.body.appendChild(successText);
        
        setTimeout(() => {
            successText.style.opacity = '0';
            successText.style.transform = 'translateY(-20px)';
        }, 10);
        
        setTimeout(() => {
            successText.remove();
        }, 1000);
        
        // 为种子卡片添加购买成功的闪烁效果
        seedCard.classList.add('purchase-flash');
        setTimeout(() => {
            seedCard.classList.remove('purchase-flash');
        }, 500);
    }
    
    // 绑定种子商店事件
    bindSeedShopEvents(container) {
        // 事件已通过onclick绑定
    }
    
    // 显示种子选择器
    showSeedSelector(plotId) {
        const seeds = this.inventory.filter(item => item.type === '种子');
        
        if (seeds.length === 0) {
            alert('你没有任何种子！请先在种子商店购买。');
            return;
        }
        
        // 创建种子选择弹窗
        const selector = document.createElement('div');
        selector.className = 'seed-selector-overlay';
        selector.innerHTML = `
            <div class="seed-selector-panel">
                <div class="selector-title">选择要种植的种子</div>
                <div class="selector-seeds">
                    ${seeds.map((seed, index) => `
                        <div class="selector-seed-item" onclick="game.plantSeed(${plotId}, ${index})">
                            <div class="seed-icon">${seed.icon}</div>
                            <div class="seed-name">${seed.name}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="selector-close-btn" onclick="this.parentElement.parentElement.remove()">取消</button>
            </div>
        `;
        
        document.body.appendChild(selector);
        
        // 点击背景关闭
        selector.addEventListener('click', (e) => {
            if (e.target === selector) {
                selector.remove();
            }
        });
    }
    
    // 种植种子
    plantSeed(plotId, seedIndex) {
        const seeds = this.inventory.filter(item => item.type === '种子');
        const seed = seeds[seedIndex];
        
        if (!seed) return;
        
        const plot = this.farmPlots[plotId];
        if (plot.seedId) {
            alert('该槽位已有作物！');
            return;
        }
        
        // 获取种子预设ID（优先使用presetId，否则尝试通过名称查找）
        const seedId = seed.presetId || this.findSeedIdByName(seed.name);
        if (!seedId) {
            console.error('无法找到种子预设ID:', seed.name);
            return;
        }
        
        const seedPreset = ItemPresets.getPreset(seedId);
        if (!seedPreset) {
            console.error('无法找到种子预设:', seedId);
            return;
        }
        
        // 种植
        plot.seedId = seedId;
        plot.seedPreset = seedPreset;
        plot.plantTime = Date.now();
        plot.growthDuration = seedPreset.growthTime;
        plot.isReady = false;
        
        // 移除种子
        const seedIndexInInventory = this.inventory.indexOf(seed);
        if (seedIndexInInventory !== -1) {
            this.inventory.splice(seedIndexInInventory, 1);
        }
        
        console.log(`在槽位${plotId}种植了${seed.name}`);
        
        // 关闭选择器
        const selector = document.querySelector('.seed-selector-overlay');
        if (selector) {
            selector.remove();
        }
        
        // 刷新农夫UI
        if (this.currentCharacter && this.currentCharacter.name === '农夫') {
            const container = document.getElementById('characterPanel');
            if (container) {
                this.createFarmerUI(container, this.currentCharacter);
            }
        }
    }
    
    // 通过名称查找种子预设ID（辅助方法）
    findSeedIdByName(seedName) {
        const seedMap = {
            '胡萝卜种子': 'carrot_seed',
            '土豆种子': 'potato_seed',
            '鱼苗': 'fish_seed',
            '蘑菇孢子': 'mushroom_seed',
            '番茄种子': 'tomato_seed',
            '香蕉种子': 'banana_seed',
            '茶叶种子': 'tea_seed'
        };
        return seedMap[seedName] || null;
    }
    
    // 收获作物
    harvestCrop(plotId) {
        const plot = this.farmPlots[plotId];
        if (!plot.seedId) return;
        
        const now = Date.now();
        const elapsed = (now - plot.plantTime) / 1000;
        
        if (elapsed < plot.growthDuration) {
            alert('作物还未成熟！');
            return;
        }
        
        // 计算收获数量
        const harvestCount = Math.floor(Math.random() * (plot.seedPreset.harvestMax - plot.seedPreset.harvestMin + 1)) + plot.seedPreset.harvestMin;
        
        // 添加作物到背包
        const cropPreset = ItemPresets.getPreset(plot.seedPreset.cropId);
        for (let i = 0; i < harvestCount; i++) {
            const crop = new Item(cropPreset);
            this.inventory.push(crop);
        }
        
        console.log(`收获了 ${harvestCount} 个 ${cropPreset.name}`);
        
        // 清空槽位（移除自动重种功能）
        plot.seedId = null;
        plot.seedPreset = null;
        plot.plantTime = null;
        plot.growthDuration = 0;
        plot.isReady = false;
        
        // 显示收获提示
        alert(`收获了 ${harvestCount} 个 ${cropPreset.name}！`);
        
        // 刷新农夫UI
        if (this.currentCharacter && this.currentCharacter.name === '农夫') {
            const container = document.getElementById('characterPanel');
            if (container) {
                this.createFarmerUI(container, this.currentCharacter);
            }
        }
    }
    
    // 铲除作物
    removeCrop(plotId) {
        if (!confirm('确定要铲除这个作物吗？')) {
            return;
        }
        
        const plot = this.farmPlots[plotId];
        
        // 清空槽位
        plot.seedId = null;
        plot.seedPreset = null;
        plot.plantTime = null;
        plot.growthDuration = 0;
        plot.isReady = false;
        
        console.log(`铲除了槽位${plotId}的作物`);
        
        // 刷新农夫UI
        if (this.currentCharacter && this.currentCharacter.name === '农夫') {
            const container = document.getElementById('characterPanel');
            if (container) {
                this.createFarmerUI(container, this.currentCharacter);
            }
        }
    }
    
    // 更新农场系统（在game.update中调用）
    updateFarmPlots() {
        // 这个方法会在游戏主循环中被调用，用于更新作物生长状态
        // 实际的更新逻辑在createPlotHTML中实时计算
    }
    
    // 创建记录员UI
    createRecorderUI(container, character) {
        // 获取所有存档
        const saves = this.getAllSaves();
        
        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="recorder-section">
                <div class="section-title">📜 存档管理</div>
                
                <div class="recorder-actions">
                    <button class="recorder-btn save-btn" id="createSaveBtn">
                        💾 创建新存档
                    </button>
                </div>
                
                <div class="saves-list">
                    <div class="section-subtitle">已有存档 (${saves.length}/10)</div>
                    ${saves.length > 0 ? this.createSavesListHTML(saves) : '<div class="empty-saves">暂无存档记录</div>'}
                </div>
            </div>
        `;
        
        // 绑定事件
        this.bindRecorderEvents(container, saves);
    }
    
    // 创建存档列表HTML
    createSavesListHTML(saves) {
        return saves.map((save, index) => {
            const saveData = save.data;
            const saveTime = new Date(save.timestamp).toLocaleString('zh-CN');
            
            return `
                <div class="save-card" data-save-index="${index}">
                    <div class="save-header">
                        <div class="save-title">
                            <span class="save-icon">📁</span>
                            <span class="save-name">存档 ${index + 1}</span>
                        </div>
                        <div class="save-time">${saveTime}</div>
                    </div>
                    <div class="save-details">
                        <div class="save-info-row">
                            <span class="save-label">金币:</span>
                            <span class="save-value">💰 ${saveData.gold || 0}</span>
                        </div>
                        <div class="save-info-row">
                            <span class="save-label">角色数:</span>
                            <span class="save-value">👥 ${saveData.characters ? saveData.characters.length : 0}</span>
                        </div>
                        <div class="save-info-row">
                            <span class="save-label">物品数:</span>
                            <span class="save-value">🎒 ${saveData.inventory ? saveData.inventory.length : 0}</span>
                        </div>
                        <div class="save-info-row">
                            <span class="save-label">当前关卡:</span>
                            <span class="save-value">🗺️ ${saveData.currentLevelId ? this.getLevelName(saveData.currentLevelId) : '未知'}</span>
                        </div>
                    </div>
                    <div class="save-actions">
                        <button class="save-action-btn overwrite-btn" data-save-index="${index}">
                            💾 覆盖存档
                        </button>
                        <button class="save-action-btn load-btn" data-save-index="${index}">
                            📂 读取此存档
                        </button>
                        <button class="save-action-btn delete-btn" data-save-index="${index}">
                            🗑️ 删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 获取关卡名称
    getLevelName(levelId) {
        const level = this.levels.find(l => l.id === levelId);
        return level ? level.name : '未知';
    }
    
    // 获取所有存档
    getAllSaves() {
        const saves = [];
        for (let i = 0; i < 10; i++) {
            const saveKey = `gameSave_${i}`;
            const saveData = localStorage.getItem(saveKey);
            if (saveData) {
                try {
                    const parsed = JSON.parse(saveData);
                    saves.push({
                        index: i,
                        data: parsed,
                        timestamp: parsed.timestamp || Date.now()
                    });
                } catch (e) {
                    console.error(`读取存档${i}失败:`, e);
                }
            }
        }
        // 按时间排序，最新的在前
        return saves.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // 绑定记录员事件
    bindRecorderEvents(container, saves) {
        // 创建新存档按钮
        const createSaveBtn = container.querySelector('#createSaveBtn');
        if (createSaveBtn) {
            createSaveBtn.addEventListener('click', () => {
                this.createNewSave();
            });
        }
        
        // 覆盖存档按钮
        const overwriteBtns = container.querySelectorAll('.overwrite-btn[data-save-index]');
        overwriteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const saveIndex = parseInt(btn.dataset.saveIndex);
                const save = saves.find(s => s.index === saveIndex);
                if (save) {
                    this.overwriteSaveByIndex(save.index);
                }
            });
        });
        
        // 读取存档按钮
        const loadBtns = container.querySelectorAll('.load-btn[data-save-index]');
        loadBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const saveIndex = parseInt(btn.dataset.saveIndex);
                const save = saves.find(s => s.index === saveIndex);
                if (save) {
                    this.loadSaveByIndex(save.index);
                }
            });
        });
        
        // 删除存档按钮
        const deleteBtns = container.querySelectorAll('.delete-btn[data-save-index]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const saveIndex = parseInt(btn.dataset.saveIndex);
                const save = saves.find(s => s.index === saveIndex);
                if (save) {
                    this.deleteSaveByIndex(save.index);
                }
            });
        });
    }
    
    // 创建新存档
    createNewSave() {
        // 找到第一个空的存档位
        let saveIndex = -1;
        for (let i = 0; i < 10; i++) {
            const saveKey = `gameSave_${i}`;
            if (!localStorage.getItem(saveKey)) {
                saveIndex = i;
                break;
            }
        }
        
        if (saveIndex === -1) {
            alert('存档位已满！请先删除一些存档。');
            return;
        }
        
        // 保存游戏 - 只保存纯数据
        const saveData = {
            // 基础数据
            gold: this.gold,
            killCount: this.killCount || 0,
            crisisValue: this.crisisValue || 0,
            currentLevelId: this.currentLevel ? this.currentLevel.id : 6,
            
            // 角色数据 - 使用toJSON()方法
            characters: this.characters.map(c => c.toJSON()),
            
            // 背包数据
            inventory: this.inventory.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                quantity: item.quantity,
                description: item.description,
                effects: item.effects,
                icon: item.icon,
                presetId: item.presetId,
                affixes: item.affixes,
                slot: item.slot
            })),
            
            // 农场数据
            farmPlots: this.farmPlots ? this.farmPlots.map(plot => ({
                id: plot.id,
                seedId: plot.seedId,
                seedPreset: plot.seedPreset,
                plantTime: plot.plantTime,
                growthDuration: plot.growthDuration,
                isReady: plot.isReady,
                crop: plot.crop
            })) : [],
            
            // 任务数据
            availableQuests: this.availableQuests || [],
            acceptedQuests: this.acceptedQuests || [],
            completedQuests: this.completedQuests || [],
            
            // 时间戳和版本
            timestamp: Date.now(),
            version: '2.0'
        };
        
        const saveKey = `gameSave_${saveIndex}`;
        localStorage.setItem(saveKey, JSON.stringify(saveData));
        
        console.log(`游戏已保存到存档位 ${saveIndex}`);
        alert(`存档创建成功！\n存档位置：存档 ${saveIndex + 1}`);
        
        // 刷新UI
        this.initCharacterPanel();
    }
    
    // 通过索引读取存档
    loadSaveByIndex(index) {
        const saveKey = `gameSave_${index}`;
        const saveData = localStorage.getItem(saveKey);
        
        if (!saveData) {
            alert('存档不存在！');
            return;
        }
        
        if (!confirm(`确定要读取存档 ${index + 1} 吗？\n当前进度将会丢失！`)) {
            return;
        }
        
        try {
            const data = JSON.parse(saveData);
            
            // 1. 恢复基础数据
            this.gold = data.gold || 0;
            this.killCount = data.killCount || 0;
            this.crisisValue = data.crisisValue || 0;
            this.updateGoldDisplay();
            
            // 2. 恢复角色 - 使用Character构造函数重建（自动包含所有方法）
            this.characters = [];
            if (data.characters && data.characters.length > 0) {
                data.characters.forEach(charData => {
                    // 通过构造函数创建新角色对象
                    const character = new Character(charData);
                    
                    // 恢复运行时状态
                    character.currentHealth = charData.currentHealth || charData.maxHealth;
                    character.currentMana = charData.currentMana || 0;
                    character.currentExp = charData.currentExp || 0;
                    character.isDead = charData.isDead || false;
                    
                    // 恢复技能 - 使用Skill构造函数重建
                    if (charData.skills) {
                        character.skills = charData.skills.map(skillData => {
                            if (!skillData) return null;
                            return new Skill(skillData);
                        });
                    }
                    
                    // 恢复已学习技能
                    if (charData.learnedSkills) {
                        character.learnedSkills = charData.learnedSkills.map(skillData => {
                            return new Skill(skillData);
                        });
                    }
                    
                    // 恢复装备
                    if (charData.equipment) {
                        character.equipment = {};
                        for (let slot in charData.equipment) {
                            if (charData.equipment[slot]) {
                                character.equipment[slot] = new Item(charData.equipment[slot]);
                            }
                        }
                    }
                    
                    this.characters.push(character);
                });
            }
            
            // 3. 恢复背包 - 使用Item构造函数重建
            this.inventory = [];
            if (data.inventory && data.inventory.length > 0) {
                data.inventory.forEach(itemData => {
                    const item = new Item(itemData);
                    this.inventory.push(item);
                });
            }
            
            // 4. 恢复农场
            if (data.farmPlots) {
                this.farmPlots = data.farmPlots.map(plotData => ({
                    id: plotData.id,
                    seedId: plotData.seedId,
                    seedPreset: plotData.seedPreset,
                    plantTime: plotData.plantTime,
                    growthDuration: plotData.growthDuration,
                    isReady: plotData.isReady,
                    crop: plotData.crop
                }));
            }
            
            // 5. 恢复任务 - 重新创建Quest实例
            this.availableQuests = [];
            if (data.availableQuests) {
                data.availableQuests.forEach(questData => {
                    const quest = new Quest(questData);
                    this.availableQuests.push(quest);
                });
            }
            
            this.acceptedQuests = [];
            if (data.acceptedQuests) {
                data.acceptedQuests.forEach(questData => {
                    const quest = new Quest(questData);
                    this.acceptedQuests.push(quest);
                });
            }
            
            this.completedQuests = [];
            if (data.completedQuests) {
                data.completedQuests.forEach(questData => {
                    const quest = new Quest(questData);
                    this.completedQuests.push(quest);
                });
            }
            
            // 6. 恢复关卡
            if (data.currentLevelId) {
                this.loadLevel(data.currentLevelId, { isLoadingFromSave: true });
            }
            
            // 7. 刷新UI
            this.initCharacterPanel();
            this.initBattlePanel();
            
            console.log(`存档 ${index} 读取成功`);
            alert(`存档读取成功！`);
            
        } catch (error) {
            console.error('读取存档失败:', error);
            alert('读取存档失败：' + error.message);
        }
    }
    
    // 通过索引删除存档
    deleteSaveByIndex(index) {
        if (!confirm(`确定要删除存档 ${index + 1} 吗？\n此操作无法撤销！`)) {
            return;
        }
        
        const saveKey = `gameSave_${index}`;
        localStorage.removeItem(saveKey);
        
        console.log(`存档 ${index} 已删除`);
        alert(`存档 ${index + 1} 已删除！`);
        
        // 刷新UI
        this.initCharacterPanel();
    }
    
    // 通过索引覆盖存档
    overwriteSaveByIndex(index) {
        try {
            if (!confirm(`确定要覆盖存档 ${index + 1} 吗？\n原存档数据将会丢失！`)) {
                return;
            }
            
            // 保存当前游戏状态 - 只保存纯数据
            const saveData = {
                // 基础数据
                gold: this.gold,
                killCount: this.killCount || 0,
                crisisValue: this.crisisValue || 0,
                currentLevelId: this.currentLevel ? this.currentLevel.id : 6,
                
                // 角色数据 - 使用toJSON()方法
                characters: this.characters.map(c => c.toJSON()),
                
                // 背包数据
                inventory: this.inventory.map(item => ({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    quantity: item.quantity,
                    description: item.description,
                    effects: item.effects,
                    icon: item.icon,
                    presetId: item.presetId,
                    affixes: item.affixes,
                    slot: item.slot
                })),
                
                // 农场数据
                farmPlots: this.farmPlots ? this.farmPlots.map(plot => ({
                    id: plot.id,
                    seedId: plot.seedId,
                    seedPreset: plot.seedPreset,
                    plantTime: plot.plantTime,
                    growthDuration: plot.growthDuration,
                    isReady: plot.isReady,
                    crop: plot.crop
                })) : [],
                
                // 任务数据
                availableQuests: this.availableQuests || [],
                acceptedQuests: this.acceptedQuests || [],
                completedQuests: this.completedQuests || [],
                
                // 时间戳和版本
                timestamp: Date.now(),
                version: '2.0'
            };
            
            const saveKey = `gameSave_${index}`;
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            
            console.log(`游戏已覆盖保存到存档位 ${index}`);
            alert(`存档 ${index + 1} 已覆盖！\n当前游戏进度已保存。`);
            
            // 刷新UI以显示更新后的存档信息
            this.initCharacterPanel();
        } catch (error) {
            console.error('覆盖存档时发生错误:', error);
            alert(`覆盖存档失败：${error.message}\n请检查浏览器存储空间或刷新页面重试。`);
        }
    }
    
    // 显示制造成功面板
    showCraftingSuccessPanel(item) {
        // 检查是否为匠心巨制
        const isMasterwork = item.name.includes("匠心巨制的");
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'crafting-success-modal';
        modal.innerHTML = `
            <div class="crafting-success-content ${isMasterwork ? 'masterwork' : ''}">
                <div class="crafting-success-header">
                    <h3>${isMasterwork ? '🌟 匠心巨制！' : '制造成功！'}</h3>
                    ${isMasterwork ? '<div class="masterwork-subtitle">大成功！制造出匠心级别装备！副词条数量+1！</div>' : ''}
                    <button class="close-button" onclick="this.closest('.crafting-success-modal').remove()">×</button>
                </div>
                <div class="crafting-success-body">
                    ${this.generateItemDetailHTML(item)}
                </div>
                <div class="crafting-success-footer">
                    <button class="confirm-button" onclick="this.closest('.crafting-success-modal').remove()">确认</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 为匠心巨制添加特殊动画效果
        if (isMasterwork) {
            modal.classList.add('masterwork-animation');
        }
        
        // 添加点击外部关闭功能
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // 获取词条稀有度颜色
    getAffixRarityColor(rarity) {
        const colors = {
            '普通': '#FFFFFF',
            '稀有': '#1E90FF',
            '神话': '#9932CC',
            '传说': '#FF8C00'
        };
        return colors[rarity] || '#FFFFFF';
    }
    
    // 生成物品详细信息HTML
    generateItemDetailHTML(item) {
        let html = `
            <div class="item-detail-display">
                <div class="item-header">
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-info">
                        <div class="item-name" style="color: ${item.getRarityColor()}">${item.name}</div>
                        <div class="item-type">${item.type}</div>
                        ${item.equipmentType ? `<div class="equipment-type">${item.equipmentType}</div>` : ''}
                        <div class="item-rarity" style="color: ${item.getRarityColor()}">${item.rarity}</div>
                    </div>
                </div>
        `;
        
        // 如果是装备，显示主词条和副词条
        if (item.equipmentType) {
            html += `
                <div class="equipment-affixes">
                    <div class="main-affix-section">
                        <h4>主词条</h4>
                        <div class="main-affix-display">${item.mainAffix}</div>
                    </div>
            `;
            
            if (item.subAffixes && item.subAffixes.length > 0) {
                html += `
                    <div class="sub-affixes-section">
                        <h4>副词条</h4>
                        <div class="sub-affixes-list">
                            ${item.subAffixes.map(affix => `
                                <div class="sub-affix-item" style="color: ${this.getAffixRarityColor(affix.rarity)}">
                                    副词条-${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            html += `</div>`;
        }
        
        html += `
                <div class="item-description">
                    <p>${item.description}</p>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // 从背包中移除指定数量的物品
    removeItemsFromInventory(itemId, count) {
        let removed = 0;
        for (let i = this.inventory.length - 1; i >= 0 && removed < count; i--) {
            const item = this.inventory[i];
            if (item.name === ItemPresets.getPreset(itemId).name) {
                this.inventory.splice(i, 1);
                removed++;
            }
        }
        return removed;
    }
    
    // 创建匠心巨制装备（10%概率触发）
    createMasterworkEquipment(item) {
        if (item.type !== "装备") return;
        
        // 添加匠心巨制前缀
        item.name = "匠心巨制的" + item.name;
        
        // 额外生成一个副词条
        const additionalAffix = this.generateAdditionalAffix(item);
        if (additionalAffix) {
            item.subAffixes.push(additionalAffix);
        }
        
        console.log(`🌟 制造出了匠心巨制装备: ${item.name}`);
    }
    
    // 生成额外的副词条
    generateAdditionalAffix(item) {
        // 获取词条稀有度权重
        const rarityWeights = AffixPresets.getAffixRarityWeights(item.rarity);
        const affixesByRarity = AffixPresets.getAffixesByRarity();
        
        // 根据权重随机选择词条稀有度
        const selectedRarity = this.weightedRandomSelect(rarityWeights);
        
        // 从该稀有度的词条中随机选择
        const availableAffixes = affixesByRarity[selectedRarity];
        if (availableAffixes && availableAffixes.length > 0) {
            // 过滤掉已有的词条，避免重复
            const existingAffixNames = item.subAffixes.map(affix => affix.name);
            const filteredAffixes = availableAffixes.filter(affixId => {
                const affixPreset = AffixPresets.getPreset(affixId);
                return affixPreset && !existingAffixNames.includes(affixPreset.name);
            });
            
            if (filteredAffixes.length > 0) {
                const randomAffixId = filteredAffixes[Math.floor(Math.random() * filteredAffixes.length)];
                const affixPreset = AffixPresets.getPreset(randomAffixId);
                
                if (affixPreset) {
                    // 生成随机数值
                    const value = this.generateRandomValue(affixPreset.minValue, affixPreset.maxValue);
                    
                    return {
                        name: affixPreset.name,
                        attribute: affixPreset.attribute,
                        value: value,
                        rarity: affixPreset.rarity
                    };
                }
            }
        }
        
        return null;
    }
    
    // 权重随机选择（复用Item类的逻辑）
    weightedRandomSelect(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [rarity, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return rarity;
            }
        }
        
        return Object.keys(weights)[0]; // 默认返回第一个
    }
    
    // 生成随机数值（复用Item类的逻辑）
    generateRandomValue(min, max) {
        if (typeof min === 'number' && typeof max === 'number') {
            if (Number.isInteger(min) && Number.isInteger(max)) {
                // 整数范围
                return Math.floor(Math.random() * (max - min + 1)) + min;
            } else {
                // 浮点数范围
                return Math.round((Math.random() * (max - min) + min) * 10) / 10;
            }
        }
        return min;
    }
    
    // 获取NPC描述信息
    getNPCDescription(characterName) {
        const descriptions = {
            '商人': '村庄里的商人，专门买卖各种物品和装备。他总是能找到你需要的东西，当然价格也很公道。',
            '村长': '村庄的领导者，负责管理村庄的日常事务。他年迈而睿智，对村庄的历史了如指掌。',
            '孵化师': '专门负责孵化和培养各种生物的专家。她拥有神秘的力量，能够帮助生物快速成长。',
            '仓库管理员': '负责管理村庄仓库的工作人员。她井井有条，知道仓库里每一件物品的位置。',
            '角色管理员': '负责管理村庄中的所有角色。她能够帮助你查看和管理你收集到的各种角色，包括它们的属性、技能和装备情况。',
            '手艺人': '村庄里的工匠大师，擅长制作各种装备和道具。他能将普通的材料转化为实用的装备。',
            '记录员': '村庄的记录保管者，负责记录和保存冒险者的重要历程。他可以帮助你保存游戏进度，或者读取之前保存的记录。',
            '厨子': '村庄里的烹饪大师，擅长将各种基础食材烹制成美味佳肴。他制作的菜肴不仅美味，还能为蛋提供更多的营养，让孵化出的角色更加强大。',
            '农夫': '村庄里的种植专家，经营着种子商店和农场。她可以出售各种作物种子，你也可以在她的农场中种植这些种子，等待作物成熟后收获新鲜的食材。'
        };
        return descriptions[characterName] || '一个神秘的NPC角色。';
    }
    
    // 创建玩家完整UI
    createPlayerUI(container, character) {
        container.innerHTML = `
            <div class="character-info">
                <div class="character-header">
                    <div class="character-avatar">${character.avatar}</div>
                    <div class="character-details">
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-meta">
                            <span class="character-type">${character.type}</span>
                            <span class="character-level">等级 ${character.level}</span>
                            <span class="character-profession">${character.profession}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="health-mana-section">
                <div class="health-bar-container">
                    <div class="bar-label">生命值</div>
                    <div class="health-bar">
                        <div class="health-fill" style="width: ${(character.currentHealth / character.maxHealth) * 100}%"></div>
                    </div>
                    <div class="bar-text">${Math.floor(character.currentHealth)}/${Math.floor(character.maxHealth)}</div>
                </div>
                <div class="mana-bar-container">
                    <div class="bar-label">魔法值</div>
                    <div class="mana-bar">
                        <div class="mana-fill" style="width: ${(character.currentMana / character.maxMana) * 100}%"></div>
                    </div>
                    <div class="bar-text">${Math.floor(character.currentMana)}/${Math.floor(character.maxMana)}</div>
                </div>
                <div class="exp-bar-container">
                    <div class="bar-label">经验值</div>
                    <div class="exp-bar">
                        <div class="exp-fill" style="width: ${(character.currentExp / character.maxExp) * 100}%"></div>
                    </div>
                    <div class="bar-text">${Math.floor(character.currentExp)}/${Math.floor(character.maxExp)}</div>
                </div>
            </div>
            
            <div class="attributes-section">
                <div class="section-title">主属性</div>
                <div class="attributes-grid">
                    <div class="attribute-item">
                        <span class="attribute-icon">💪</span>
                        <span class="attribute-name">力量</span>
                        <span class="attribute-value">${character.attributes.strength}</span>
                    </div>
                    <div class="attribute-item">
                        <span class="attribute-icon">👟</span>
                        <span class="attribute-name">敏捷</span>
                        <span class="attribute-value">${character.attributes.agility}</span>
                    </div>
                    <div class="attribute-item">
                        <span class="attribute-icon">🧠</span>
                        <span class="attribute-name">智慧</span>
                        <span class="attribute-value">${character.attributes.intelligence}</span>
                    </div>
                    <div class="attribute-item">
                        <span class="attribute-icon">🔧</span>
                        <span class="attribute-name">技巧</span>
                        <span class="attribute-value">${character.attributes.skill}</span>
                    </div>
                </div>
            </div>
            
            <div class="secondary-attributes-section">
                <div class="section-title">副属性</div>
                <div class="secondary-attributes-grid">
                    <div class="secondary-attribute-item">
                        <span class="attribute-icon">⚔️</span>
                        <span class="attribute-name">攻击力</span>
                        <span class="attribute-value">${character.secondaryAttributes.attackPower}</span>
                    </div>
                    <div class="secondary-attribute-item">
                        <span class="attribute-icon">🛡️</span>
                        <span class="attribute-name">防御力</span>
                        <span class="attribute-value">${character.secondaryAttributes.defense}</span>
                    </div>
                    <div class="secondary-attribute-item">
                        <span class="attribute-icon">💨</span>
                        <span class="attribute-name">移动速度</span>
                        <span class="attribute-value">${character.secondaryAttributes.moveSpeed}</span>
                    </div>
                    <div class="secondary-attribute-item">
                        <span class="attribute-icon">🩹</span>
                        <span class="attribute-name">生命恢复</span>
                        <span class="attribute-value">${character.secondaryAttributes.healthRegen}/秒</span>
                    </div>
                    <div class="secondary-attribute-item">
                        <span class="attribute-icon">💙</span>
                        <span class="attribute-name">魔法恢复</span>
                        <span class="attribute-value">${character.secondaryAttributes.manaRegen}/秒</span>
                    </div>
                    <div class="secondary-attribute-item">
                        <span class="attribute-icon">⚖️</span>
                        <span class="attribute-name">体重</span>
                        <span class="attribute-value">${character.secondaryAttributes.weight}kg</span>
                    </div>
                    <div class="secondary-attribute-item">
                        <span class="attribute-icon">📦</span>
                        <span class="attribute-name">体积</span>
                        <span class="attribute-value">${character.secondaryAttributes.volume}L</span>
                    </div>
                    <div class="secondary-attribute-item">
                        <span class="attribute-icon">⭐</span>
                        <span class="attribute-name">经验获取</span>
                        <span class="attribute-value">${character.secondaryAttributes.expGain}%</span>
                    </div>
                </div>
            </div>
            
            <div class="skills-section">
                <div class="section-title">技能</div>
                <div class="skills-grid">
                    ${character.skills.map((skill, index) => {
                        const isLocked = character.skillSlotLocks[index];
                        const slotClass = isLocked ? 'locked' : '';
                        
                        if (skill) {
                            // 有技能时显示完整信息
                            return `
                                <div class="skill-slot equipped ${slotClass}" data-skill-index="${index}">
                                    <div class="skill-slot-header">
                                        <div class="skill-slot-icon">${skill.icon}</div>
                                        <div class="skill-slot-info">
                                            <div class="skill-slot-name">${skill.name}</div>
                                            <div class="skill-slot-type">${skill.getTypeText()}</div>
                                        </div>
                                    </div>
                                    <div class="skill-slot-description">${skill.description}</div>
                                </div>
                            `;
                        } else if (isLocked) {
                            // 锁定状态
                            return `
                                <div class="skill-slot locked ${slotClass}" data-skill-index="${index}">
                                    <div class="skill-slot-locked">
                                        <div class="skill-slot-lock-icon">🔒</div>
                                        <div class="skill-slot-lock-text">锁定</div>
                                    </div>
                                </div>
                            `;
                        } else {
                            // 空槽位
                            return `
                                <div class="skill-slot empty ${slotClass}" data-skill-index="${index}">
                                    <div class="skill-slot-empty">
                                        <div class="skill-slot-empty-icon">➕</div>
                                        <div class="skill-slot-empty-text">点击装备技能</div>
                                    </div>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
            
            <div class="equipment-section">
                <div class="section-title">装备</div>
                <div class="equipment-grid">
                    <div class="equipment-slot" data-slot="weapon">
                        <div class="slot-label">武器</div>
                        <div class="slot-content">${character.equipment.weapon ? character.equipment.weapon.name : '空'}</div>
                    </div>
                    <div class="equipment-slot" data-slot="armor">
                        <div class="slot-label">护甲</div>
                        <div class="slot-content">${character.equipment.armor ? character.equipment.armor.name : '空'}</div>
                    </div>
                    <div class="equipment-slot" data-slot="offhand">
                        <div class="slot-label">副手</div>
                        <div class="slot-content">${character.equipment.offhand ? character.equipment.offhand.name : '空'}</div>
                    </div>
                    <div class="equipment-slot" data-slot="misc">
                        <div class="slot-label">杂项</div>
                        <div class="slot-content">${character.equipment.misc ? character.equipment.misc.name : '空'}</div>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定装备槽点击事件
        container.querySelectorAll('.equipment-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotType = e.currentTarget.dataset.slot;
                console.log(`点击了${slotType}装备槽位`);
                this.showEquipmentSelectionPanel(character, slotType);
            });
        });
        
        // 绑定技能槽点击事件
        container.querySelectorAll('.skill-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const skillIndex = parseInt(e.currentTarget.dataset.skillIndex);
                
                // 检查是否是被动技能槽（槽位0），被动技能槽无法点击
                if (skillIndex === 0) {
                    console.log(`技能槽 ${skillIndex + 1} 是被动技能槽，无法点击操作`);
                    return;
                }
                
                // 检查技能槽是否被锁定
                if (character.skillSlotLocks && character.skillSlotLocks[skillIndex]) {
                    console.log(`技能槽 ${skillIndex + 1} 被锁定，无法操作`);
                    return;
                }
                
                console.log(`点击了技能槽位${skillIndex}`);
                this.showSkillSelectionPanel(character, skillIndex);
            });
        });
    }
    
    // 创建空白UI
    createEmptyUI(container) {
        container.innerHTML = '';
    }
    
    // 切换角色
    switchCharacter(presetName) {
        this.currentCharacter = new Character(CharacterPresets.getPreset(presetName));
        this.initCharacterPanel();
        console.log('Character switched to:', this.currentCharacter.name);
    }
    
    // 绘制地图背景
    drawMapBackground() {
        if (!this.ctx) return;
        
        try {
            // 创建地图图片对象（如果还没有创建）
            if (!this.mapImage) {
                this.mapImage = new Image();
                this.mapImage.onload = () => {
                    console.log('地图背景图片加载成功');
                    // 图片加载完成后重新绘制关卡
                    this.drawLevel();
                };
                this.mapImage.onerror = () => {
                    console.warn('地图背景图片加载失败，使用默认背景');
                };
                // 设置图片路径
                this.mapImage.src = 'images/map.png'; // 假设图片是PNG格式
                return; // 第一次加载时直接返回
            }
            
            // 如果图片已加载完成，绘制地图背景
            if (this.mapImage.complete && this.mapImage.naturalWidth > 0) {
                this.ctx.save();
                
                // 设置透明度，让地图显示在绿色背景之上
                this.ctx.globalAlpha = 0.9; // 提高透明度，使地图更明显地显示在绿色背景之上
                
                // 计算缩放比例，让地图适应画布大小
                const scaleX = this.canvas.width / this.mapImage.naturalWidth;
                const scaleY = this.canvas.height / this.mapImage.naturalHeight;
                const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例确保覆盖整个画布
                
                // 计算居中位置
                const scaledWidth = this.mapImage.naturalWidth * scale;
                const scaledHeight = this.mapImage.naturalHeight * scale;
                const x = (this.canvas.width - scaledWidth) / 2;
                const y = (this.canvas.height - scaledHeight) / 2;
                
                // 绘制地图背景
                this.ctx.drawImage(this.mapImage, x, y, scaledWidth, scaledHeight);
                
                this.ctx.restore();
                
                console.log(`地图背景已绘制: 原始尺寸(${this.mapImage.naturalWidth}x${this.mapImage.naturalHeight}), 缩放后(${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}), 位置(${x.toFixed(1)}, ${y.toFixed(1)})`);
            }
        } catch (error) {
            console.error('绘制地图背景时出错:', error);
        }
    }
    
    // 绘制森林背景
    drawForestBackground() {
        if (!this.ctx) return;
        
        try {
            // 创建森林图片对象（如果还没有创建）
            if (!this.forestImage) {
                this.forestImage = new Image();
                this.forestImage.onload = () => {
                    console.log('森林背景图片加载成功');
                    // 图片加载完成后重新绘制关卡
                    this.drawLevel();
                };
                this.forestImage.onerror = () => {
                    console.warn('森林背景图片加载失败，使用默认背景');
                };
                // 设置图片路径
                this.forestImage.src = 'images/senlin.png';
                return; // 第一次加载时直接返回
            }
            
            // 如果图片已加载完成，绘制森林背景
            if (this.forestImage.complete && this.forestImage.naturalWidth > 0) {
                this.ctx.save();
                
                // 设置透明度，让森林图片显示在树木之上
                this.ctx.globalAlpha = 0.9;
                
                // 计算缩放比例，让森林图片适应画布大小
                const scaleX = this.canvas.width / this.forestImage.naturalWidth;
                const scaleY = this.canvas.height / this.forestImage.naturalHeight;
                const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例确保覆盖整个画布
                
                // 计算居中位置
                const scaledWidth = this.forestImage.naturalWidth * scale;
                const scaledHeight = this.forestImage.naturalHeight * scale;
                const x = (this.canvas.width - scaledWidth) / 2;
                const y = (this.canvas.height - scaledHeight) / 2;
                
                // 绘制森林背景
                this.ctx.drawImage(this.forestImage, x, y, scaledWidth, scaledHeight);
                
                this.ctx.restore();
                
                console.log(`森林背景已绘制: 原始尺寸(${this.forestImage.naturalWidth}x${this.forestImage.naturalHeight}), 缩放后(${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}), 位置(${x.toFixed(1)}, ${y.toFixed(1)})`);
            }
        } catch (error) {
            console.error('绘制森林背景时出错:', error);
        }
    }
    
    // 绘制村庄背景
    drawVillageBackground() {
        if (!this.ctx) return;
        
        try {
            // 创建村庄图片对象（如果还没有创建）
            if (!this.villageImage) {
                this.villageImage = new Image();
                this.villageImage.onload = () => {
                    console.log('村庄背景图片加载成功');
                    // 图片加载完成后重新绘制关卡
                    this.drawLevel();
                };
                this.villageImage.onerror = () => {
                    console.warn('村庄背景图片加载失败，使用默认背景');
                };
                // 设置图片路径
                this.villageImage.src = 'images/cunzhuang.png';
                return; // 第一次加载时直接返回
            }
            
            // 如果图片已加载完成，绘制村庄背景
            if (this.villageImage.complete && this.villageImage.naturalWidth > 0) {
                this.ctx.save();
                
                // 设置透明度，让村庄图片显示在房子之上
                this.ctx.globalAlpha = 1;
                
                // 计算缩放比例，让村庄图片适应画布大小
                const scaleX = this.canvas.width / this.villageImage.naturalWidth;
                const scaleY = this.canvas.height / this.villageImage.naturalHeight;
                const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例确保覆盖整个画布
                
                // 计算居中位置
                const scaledWidth = this.villageImage.naturalWidth * scale;
                const scaledHeight = this.villageImage.naturalHeight * scale;
                const x = (this.canvas.width - scaledWidth) / 2;
                const y = (this.canvas.height - scaledHeight) / 2;
                
                // 绘制村庄背景
                this.ctx.drawImage(this.villageImage, x, y, scaledWidth, scaledHeight);
                
                this.ctx.restore();
                
                console.log(`村庄背景已绘制: 原始尺寸(${this.villageImage.naturalWidth}x${this.villageImage.naturalHeight}), 缩放后(${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}), 位置(${x.toFixed(1)}, ${y.toFixed(1)})`);
            }
        } catch (error) {
            console.error('绘制村庄背景时出错:', error);
        }
    }
    
    // 绘制村庄关卡的新手指南区域
    drawVillageGuideArea() {
        if (!this.ctx) return;
        
        try {
            this.ctx.save();
            
            // 指南区域的位置和尺寸（右上角空白区域）
            const guideX = this.canvas.width - 300; // 距离右边缘20像素
            const guideY = 20; // 距离顶部20像素
            const guideWidth = 280;
            const guideHeight = 380;
            const cornerRadius = 15;
            
            // 设置正片叠底混合模式
            this.ctx.globalCompositeOperation = 'multiply';
            
            // 绘制半透明背景
            this.ctx.beginPath();
            this.ctx.moveTo(guideX + cornerRadius, guideY);
            this.ctx.lineTo(guideX + guideWidth - cornerRadius, guideY);
            this.ctx.quadraticCurveTo(guideX + guideWidth, guideY, guideX + guideWidth, guideY + cornerRadius);
            this.ctx.lineTo(guideX + guideWidth, guideY + guideHeight - cornerRadius);
            this.ctx.quadraticCurveTo(guideX + guideWidth, guideY + guideHeight, guideX + guideWidth - cornerRadius, guideY + guideHeight);
            this.ctx.lineTo(guideX + cornerRadius, guideY + guideHeight);
            this.ctx.quadraticCurveTo(guideX, guideY + guideHeight, guideX, guideY + guideHeight - cornerRadius);
            this.ctx.lineTo(guideX, guideY + cornerRadius);
            this.ctx.quadraticCurveTo(guideX, guideY, guideX + cornerRadius, guideY);
            this.ctx.closePath();
            
            // 淡灰色渐变背景（正片叠底效果）
            const gradient = this.ctx.createLinearGradient(guideX, guideY, guideX, guideY + guideHeight);
            gradient.addColorStop(0, 'rgba(240, 240, 240, 0.9)');   // 浅灰色
            gradient.addColorStop(0.5, 'rgba(220, 220, 220, 0.9)'); // 中灰色
            gradient.addColorStop(1, 'rgba(200, 200, 200, 0.9)');   // 深灰色
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // 重置混合模式为正常模式绘制边框和文字
            this.ctx.globalCompositeOperation = 'source-over';
            
            // 淡灰色边框
            this.ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制标题
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('🎮 新手指南', guideX + guideWidth / 2, guideY + 12);
            
            // 绘制指南内容
            const guideContent = [
                '📖 游戏玩法说明：',
                '',
                '🏠 村庄是你的安全基地',
                '• 商人：购买装备和道具',
                '• 村长：接受和完成任务',
                '• 孵化师：孵化和培养生物',
                '• 仓管员：管理物品仓库',
                '• 角色管理员：查看角色信息',
                '• 手艺人：制作装备道具',
                '',
                '⚔️ 战斗系统：',
                '• 点击选择角色进入战斗',
                '• 使用技能攻击敌人',
                '• 收集掉落物品和经验',
                '• 升级角色提升属性',
                '',
                '🎯 新手建议：',
                '• 先与村长对话接受任务',
                '• 完成简单任务获得奖励',
                '• 前往草原关卡开始冒险',
                '• 收集材料制作装备',
                '• 培养多个角色组建队伍'
            ];
            
            // 绘制指南文本
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            let currentY = guideY + 45;
            const lineHeight = 15;
            const textX = guideX + 12;
            
            guideContent.forEach(line => {
                if (line === '') {
                    currentY += lineHeight * 0.4; // 空行间距减少
                    return;
                }
                
                // 根据内容类型设置不同颜色和样式
                if (line.startsWith('📖') || line.startsWith('⚔️') || line.startsWith('🎯')) {
                    // 标题行 - 白色文字，无描边
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = 'bold 13px Arial';
                    this.ctx.fillText(line, textX, currentY);
                    this.ctx.font = '11px Arial';
                } else if (line.startsWith('•')) {
                    // 列表项 - 白色文字，无描边
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillText(line, textX + 8, currentY);
                } else if (line.startsWith('🏠')) {
                    // 重要说明 - 白色文字，无描边
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.fillText(line, textX, currentY);
                    this.ctx.font = '11px Arial';
                } else {
                    // 普通文本 - 白色文字，无描边
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillText(line, textX, currentY);
                }
                
                currentY += lineHeight;
            });
            
            // 绘制装饰性图标
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            
            // 在背景绘制装饰图标
            const decorIcons = ['⚔️', '🛡️', '💎', '🏆'];
            decorIcons.forEach((icon, index) => {
                const iconX = guideX + 40 + (index * 45);
                const iconY = guideY + guideHeight - 35;
                this.ctx.fillText(icon, iconX, iconY);
            });
            
            this.ctx.restore();
            
            // 添加调试信息
            console.log(`新手指南区域已绘制: 位置(${guideX}, ${guideY}), 尺寸(${guideWidth}x${guideHeight}), 混合模式: multiply`);
            
        } catch (error) {
            console.error('绘制村庄新手指南区域时出错:', error);
        }
    }
    
    // 绘制关卡元素
    drawElement(element) {
        this.ctx.save();
        
        switch(element.type) {
            case 'tree':
                this.drawTree(element);
                break;
            case 'house':
                this.drawHouse(element);
                break;
            case 'road':
                this.drawRoad(element);
                break;
            case 'grassland':
                this.drawGrassland(element);
                break;
            case 'flower':
                this.drawFlower(element);
                break;
            case 'npc':
                this.drawNPC(element);
                break;
        }
        
        this.ctx.restore();
    }
    
    // 绘制树木
    drawTree(element) {
        const { x, y, size } = element;
        
        // 树干
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - size/8, y - size/4, size/4, size/2);
        
        // 树冠
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size/3, size/2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // 绘制房屋
    drawHouse(element) {
        const { x, y, width, height } = element;
        
        // 房屋主体
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, width, height);
        
        // 屋顶
        this.ctx.fillStyle = '#DC143C';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y);
        this.ctx.lineTo(x + width/2, y - 30);
        this.ctx.lineTo(x + width + 10, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 门
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(x + width/2 - 15, y + height - 40, 30, 40);
        
        // 窗户
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x + 15, y + 20, 20, 20);
        this.ctx.fillRect(x + width - 35, y + 20, 20, 20);
    }
    
    // 绘制道路
    drawRoad(element) {
        const { x, y, width, height } = element;
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(x, y, width, height);
        
        // 道路中线
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height/2);
        this.ctx.lineTo(x + width, y + height/2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // 绘制草地
    drawGrassland(element) {
        const { x, y, width, height } = element;
        this.ctx.fillStyle = '#32CD32';
        this.ctx.fillRect(x, y, width, height);
    }
    
    // 绘制花朵
    drawFlower(element) {
        const { x, y, size } = element;
        
        // 花瓣
        this.ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 6; i++) {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate((i * Math.PI) / 3);
            this.ctx.beginPath();
            this.ctx.arc(0, -size/2, size/3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // 花心
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size/4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // 绘制NPC角色
    drawNPC(element) {
        const { x, y, avatar, name } = element;
        
        // 绘制NPC背景圆圈
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 35, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制边框
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 35, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 添加内阴影效果
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 32, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 绘制NPC头像
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(avatar, x, y);
        
        // 绘制NPC名称（带黑色外描边）
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 设置描边样式，避免尖刺效果
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round'; // 设置线条连接为圆角
        this.ctx.lineCap = 'round';  // 设置线条端点为圆角
        this.ctx.strokeText(name, x, y + 58);
        
        // 绘制白色文字
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillText(name, x, y + 58);
        
        // 重置文本对齐
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    // 处理画布点击事件
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // 检查是否点击了计数面板
        if (this.showEnemyCounter) {
            const panelX = 20;
            const panelY = 20;
            const panelWidth = 220;
            const panelHeight = 110;
            
            // 检查是否点击了任务进度按钮（优先检查）
            const btnX = panelX + 15;
            const btnY = panelY + 82;
            const btnWidth = 190;
            const btnHeight = 20;
            
            if (clickX >= btnX && clickX <= btnX + btnWidth &&
                clickY >= btnY && clickY <= btnY + btnHeight) {
                this.showQuestProgressPanel();
                return; // 点击了任务进度按钮，不继续处理其他点击
            }
            
            // 检查是否点击了面板其他区域（切换刷怪开关）- 排除按钮区域
            if (clickX >= panelX && clickX <= panelX + panelWidth &&
                clickY >= panelY && clickY <= panelY + 75) { // 改为75，避免与按钮重叠
                this.toggleSpawnSwitch();
                return; // 点击了计数面板，不继续处理其他点击
            }
        }
        
        if (!this.currentLevel || !this.currentLevel.elements) return;
        
        // 检查是否点击了NPC
        this.currentLevel.elements.forEach(element => {
            if (element.type === 'npc') {
                const distance = Math.sqrt(
                    Math.pow(clickX - element.x, 2) + 
                    Math.pow(clickY - element.y, 2)
                );
                
                // 如果点击在NPC圆圈范围内
                if (distance <= 35) {
                    this.onNPCClick(element);
                }
            }
        });
    }
    
    // NPC点击处理
    onNPCClick(npcElement) {
        console.log(`点击了NPC: ${npcElement.name}`);
        
        // 切换到对应的NPC角色
        this.switchCharacter(npcElement.npcType);
        
        // 添加抖动效果
        this.addShakeEffect(npcElement);
    }
    
    // 添加NPC抖动效果
    addShakeEffect(npcElement) {
        // 保存原始位置
        const originalX = npcElement.x;
        const originalY = npcElement.y;
        
        // 抖动参数
        const shakeIntensity = 3; // 抖动强度
        const shakeDuration = 300; // 抖动持续时间(毫秒)
        const shakeInterval = 50; // 抖动间隔(毫秒)
        
        let shakeCount = 0;
        const maxShakes = shakeDuration / shakeInterval;
        
        const shakeTimer = setInterval(() => {
            if (shakeCount >= maxShakes) {
                // 恢复原始位置
                npcElement.x = originalX;
                npcElement.y = originalY;
                this.drawLevel(); // 重绘关卡
                clearInterval(shakeTimer);
                return;
            }
            
            // 随机偏移
            const offsetX = (Math.random() - 0.5) * shakeIntensity * 2;
            const offsetY = (Math.random() - 0.5) * shakeIntensity * 2;
            
            npcElement.x = originalX + offsetX;
            npcElement.y = originalY + offsetY;
            
            // 重绘关卡
            this.drawLevel();
            
            shakeCount++;
        }, shakeInterval);
    }
    
    // 处理画布鼠标移动事件
    handleCanvasMouseMove(e) {
        if (!this.currentLevel || !this.currentLevel.elements) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let overNPC = false;
        
        // 检查是否悬停在NPC上
        this.currentLevel.elements.forEach(element => {
            if (element.type === 'npc') {
                const distance = Math.sqrt(
                    Math.pow(mouseX - element.x, 2) + 
                    Math.pow(mouseY - element.y, 2)
                );
                
                if (distance <= 35) {
                    overNPC = true;
                }
            }
        });
        
        // 改变鼠标样式
        this.canvas.style.cursor = overNPC ? 'pointer' : 'default';
    }
    
    // 初始化开发者功能（全新系统）
    initDeveloperFunctions() {
        console.log('正在初始化全新的开发者功能系统...');
        
        // 移除旧的开发者功能元素
        this.removeLegacyDeveloperElements();
        
        // 初始化旧的开发者按钮（如果存在）
        this.initOldDeveloperButton();
        
        // 创建新的开发者功能系统
        this.createNewDeveloperSystem();
        
        console.log('全新开发者功能系统初始化完成');
    }
    
    // 初始化旧的开发者按钮
    initOldDeveloperButton() {
        const developerButton = document.getElementById('developerButton');
        const developerPanel = document.getElementById('developerPanel');
        
        if (!developerButton || !developerPanel) {
            console.log('旧开发者按钮不存在，跳过初始化');
            return;
        }
        
        console.log('初始化旧开发者按钮...');
        
        let panelVisible = false;
        
        // 按钮点击事件
        developerButton.addEventListener('click', (e) => {
            e.stopPropagation();
            panelVisible = !panelVisible;
            // 使用CSS类来控制显示/隐藏
            if (panelVisible) {
                developerPanel.style.display = 'block';
                developerPanel.classList.add('show');
            } else {
                developerPanel.classList.remove('show');
                // 等待动画完成后再隐藏
                setTimeout(() => {
                    if (!panelVisible) {
                        developerPanel.style.display = 'none';
                    }
                }, 300);
            }
        });
        
        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (panelVisible && !developerPanel.contains(e.target) && !developerButton.contains(e.target)) {
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    if (!panelVisible) {
                        developerPanel.style.display = 'none';
                    }
                }, 300);
            }
        });
        
        // 绑定各个功能按钮
        const addGoldBtn = document.getElementById('addGoldBtn');
        if (addGoldBtn) {
            addGoldBtn.addEventListener('click', () => {
                this.devAddGold();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const getAllEggsBtn = document.getElementById('getAllEggsBtn');
        if (getAllEggsBtn) {
            getAllEggsBtn.addEventListener('click', () => {
                this.devGetAllEggs();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const levelUpAllBtn = document.getElementById('levelUpAllBtn');
        if (levelUpAllBtn) {
            levelUpAllBtn.addEventListener('click', () => {
                this.devLevelUpAll();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const getAllSkillBooksBtn = document.getElementById('getAllSkillBooksBtn');
        if (getAllSkillBooksBtn) {
            getAllSkillBooksBtn.addEventListener('click', () => {
                this.devGetAllSkillBooks();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const restoreAllManaBtn = document.getElementById('restoreAllManaBtn');
        if (restoreAllManaBtn) {
            restoreAllManaBtn.addEventListener('click', () => {
                this.devRestoreAllMana();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const addMaterialsBtn = document.getElementById('addMaterialsBtn');
        if (addMaterialsBtn) {
            addMaterialsBtn.addEventListener('click', () => {
                this.devAddMaterials();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const addExpNotesBtn = document.getElementById('addExpNotesBtn');
        if (addExpNotesBtn) {
            addExpNotesBtn.addEventListener('click', () => {
                this.devAddExpNotes();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const getAllFoodsBtn = document.getElementById('getAllFoodsBtn');
        if (getAllFoodsBtn) {
            getAllFoodsBtn.addEventListener('click', () => {
                this.devGetAllFoods();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const saveGameBtn = document.getElementById('saveGameBtn');
        if (saveGameBtn) {
            saveGameBtn.addEventListener('click', () => {
                this.saveGame();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        const loadGameBtn = document.getElementById('loadGameBtn');
        if (loadGameBtn) {
            loadGameBtn.addEventListener('click', () => {
                this.loadGame();
                panelVisible = false;
                developerPanel.classList.remove('show');
                setTimeout(() => {
                    developerPanel.style.display = 'none';
                }, 300);
            });
        }
        
        console.log('旧开发者按钮初始化完成');
    }
    
    // 移除旧的开发者功能元素
    removeLegacyDeveloperElements() {
        const oldElements = [
            'addKillProgressBtn' // 只移除真正不需要的按钮
        ];
        
        oldElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
                console.log(`移除旧元素: ${id}`);
            }
        });
    }
    
    // 创建新的开发者功能系统
    createNewDeveloperSystem() {
        // 创建开发者按钮
        const developerButton = document.createElement('button');
        developerButton.id = 'newDeveloperButton';
        developerButton.className = 'new-developer-button';
        developerButton.innerHTML = '🛠️';
        developerButton.title = '开发者功能';
        
        // 设置按钮样式 - 可见
        Object.assign(developerButton.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: '1000',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            display: 'block' // 确保可见
        });
        
        // 创建开发者面板
        const developerPanel = document.createElement('div');
        developerPanel.id = 'newDeveloperPanel';
        developerPanel.className = 'new-developer-panel';
        
        // 设置面板样式
        Object.assign(developerPanel.style, {
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '280px',
            background: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '15px',
            padding: '20px',
            display: 'none',
            zIndex: '999',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
        });
        
        // 创建面板内容
        developerPanel.innerHTML = `
            <div style="color: white; font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center;">
                🛠️ 开发者功能
            </div>
            <div class="dev-function-grid" style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                <button id="newAddGoldBtn" class="dev-btn" style="background: linear-gradient(135deg, #FFD700, #FFA500); color: #333;">
                    💰 添加金币
                    <small style="display: block; font-size: 12px; opacity: 0.8;">增加1000金币</small>
                </button>
                <button id="newGetAllEggsBtn" class="dev-btn" style="background: linear-gradient(135deg, #FF6B6B, #FF8E53);">
                    🥚 获得每种蛋
                    <small style="display: block; font-size: 12px; opacity: 0.8;">获得所有蛋类型各1个</small>
                </button>
                <button id="newLevelUpAllBtn" class="dev-btn" style="background: linear-gradient(135deg, #4ECDC4, #44A08D);">
                    ⬆️ 角色等级+1
                    <small style="display: block; font-size: 12px; opacity: 0.8;">所有角色等级提升1级</small>
                </button>
                <button id="newGetAllSkillBooksBtn" class="dev-btn" style="background: linear-gradient(135deg, #A8EDEA, #FED6E3);">
                    📚 获得技能书
                    <small style="display: block; font-size: 12px; opacity: 0.8;">获得所有技能书各1本</small>
                </button>
                <button id="newRestoreAllManaBtn" class="dev-btn" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                    💙 恢复魔法值
                    <small style="display: block; font-size: 12px; opacity: 0.8;">所有角色恢复100魔法值</small>
                </button>
                <button id="newAddMaterialsBtn" class="dev-btn" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
                    🔨 添加制作材料
                    <small style="display: block; font-size: 12px; opacity: 0.8;">添加铜矿石、橡木材、香草叶各100个</small>
                </button>
            </div>
        `;
        
        // 添加按钮通用样式
        const style = document.createElement('style');
        style.textContent = `
            .dev-btn {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: left;
            }
            .dev-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            .new-developer-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0,0,0,0.4);
            }
        `;
        document.head.appendChild(style);
        
        // 添加到页面
        document.body.appendChild(developerButton);
        document.body.appendChild(developerPanel);
        
        // 绑定事件
        this.bindNewDeveloperEvents(developerButton, developerPanel);
    }
    
    // 绑定新开发者功能事件
    bindNewDeveloperEvents(button, panel) {
        let panelVisible = false;
        
        // 按钮点击事件
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            panelVisible = !panelVisible;
            panel.style.display = panelVisible ? 'block' : 'none';
        });
        
        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (panelVisible && !panel.contains(e.target) && !button.contains(e.target)) {
                panelVisible = false;
                panel.style.display = 'none';
            }
        });
        
        // 功能按钮事件
        const functions = [
            { id: 'newAddGoldBtn', method: () => this.devAddGold() },
            { id: 'newGetAllEggsBtn', method: () => this.devGetAllEggs() },
            { id: 'newLevelUpAllBtn', method: () => this.devLevelUpAll() },
            { id: 'newGetAllSkillBooksBtn', method: () => this.devGetAllSkillBooks() },
            { id: 'newRestoreAllManaBtn', method: () => this.devRestoreAllMana() },
            { id: 'newAddMaterialsBtn', method: () => this.devAddMaterials() }
        ];
        
        functions.forEach(func => {
            const btn = document.getElementById(func.id);
            if (btn) {
                btn.addEventListener('click', () => {
                    func.method();
                    panelVisible = false;
                    panel.style.display = 'none';
                });
            }
        });
    }
    
    // 新开发者功能：💰 添加金币
    devAddGold() {
        const amount = 1000;
        const oldGold = this.gold;
        this.gold += amount;
        this.updateGoldDisplay();
        
        // 显示浮动效果
        if (this.characters.length > 0) {
            const character = this.characters[0];
            this.showFloatingText(character.x, character.y - 40, `+${amount} 金币`, '#FFD700');
        }
        
        console.log(`💰 开发者功能：添加了 ${amount} 金币 (${oldGold} → ${this.gold})`);
    }
    
    // 新开发者功能：🥚 获得每种蛋
    devGetAllEggs() {
        const eggTypes = ['dirty_egg', 'smooth_egg', 'hard_egg', 'giant_egg'];
        let addedEggs = [];
        
        eggTypes.forEach(eggId => {
            try {
                const eggData = ItemPresets.getPreset(eggId);
                if (eggData) {
                    const egg = new Item(eggData);
                    this.inventory.push(egg);
                    addedEggs.push(egg.name);
                }
            } catch (error) {
                console.error(`获得蛋 ${eggId} 时发生错误:`, error);
            }
        });
        
        // 显示浮动效果
        if (this.characters.length > 0) {
            const character = this.characters[0];
            this.showFloatingText(character.x, character.y - 40, `获得 ${addedEggs.length} 种蛋`, '#FF69B4');
        }
        
        console.log(`🥚 开发者功能：获得所有蛋类型 - ${addedEggs.join(', ')}`);
    }
    
    // 新开发者功能：⬆️ 角色等级+1
    devLevelUpAll() {
        let leveledUpCharacters = [];
        
        this.characters.forEach(character => {
            if (character.level < 50) { // 限制最大等级
                character.level++;
                character.updateSecondaryAttributes();
                leveledUpCharacters.push(character.getDisplayName());
            }
        });
        
        // 显示浮动效果
        if (leveledUpCharacters.length > 0 && this.characters.length > 0) {
            const character = this.characters[0];
            this.showFloatingText(character.x, character.y - 40, `${leveledUpCharacters.length} 个角色升级`, '#00FF00');
        }
        
        console.log(`⬆️ 开发者功能：${leveledUpCharacters.length} 个角色等级提升 - ${leveledUpCharacters.join(', ')}`);
    }
    
    // 新开发者功能：📚 获得技能书
    devGetAllSkillBooks() {
        const skillBookIds = [
            'savage_charge_book', 'emergency_bandage_book', 'heavy_punch_book',
            'enrage_book', 'flying_daggers_book', 'fireball_book', 'lightning_strike_book',
            'spike_trap_book', 'whirlwind_axe_book', 'soothing_heal_book', 'rush_book',
            'magic_barrier_book', 'stomp_book', 'weakness_curse_book'
        ];
        
        let addedBooks = [];
        
        skillBookIds.forEach(bookId => {
            try {
                const bookData = ItemPresets.getPreset(bookId);
                if (bookData) {
                    const book = new Item(bookData);
                    this.inventory.push(book);
                    addedBooks.push(book.name);
                }
            } catch (error) {
                console.error(`获得技能书 ${bookId} 时发生错误:`, error);
            }
        });
        
        // 显示浮动效果
        if (this.characters.length > 0) {
            const character = this.characters[0];
            this.showFloatingText(character.x, character.y - 40, `获得 ${addedBooks.length} 本技能书`, '#9C27B0');
        }
        
        console.log(`📚 开发者功能：获得所有技能书 - ${addedBooks.length} 本`);
    }
    
    // 新开发者功能：💙 恢复魔法值
    devRestoreAllMana() {
        const restoreAmount = 100;
        let restoredCharacters = [];
        
        this.characters.forEach(character => {
            const oldMana = character.currentMana;
            character.currentMana = Math.min(character.maxMana, character.currentMana + restoreAmount);
            const actualRestore = character.currentMana - oldMana;
            
            if (actualRestore > 0) {
                restoredCharacters.push({
                    name: character.getDisplayName(),
                    restored: actualRestore
                });
                
                // 显示魔法恢复效果
                this.showFloatingText(character.x, character.y - 20, `+${actualRestore} MP`, '#4CAF50');
            }
        });
        
        console.log(`💙 开发者功能：${restoredCharacters.length} 个角色恢复魔法值`);
    }
    
    // 新开发者功能：🔨 添加制作材料
    devAddMaterials() {
        const materials = [
            { id: 'copper_ore', name: '铜矿石', count: 100 },
            { id: 'oak_wood', name: '橡木材', count: 100 },
            { id: 'herb_leaf', name: '香草叶', count: 100 }
        ];
        
        let addedMaterials = [];
        
        materials.forEach(material => {
            try {
                const itemData = ItemPresets.getPreset(material.id);
                if (itemData) {
                    for (let i = 0; i < material.count; i++) {
                        const item = new Item(itemData);
                        this.inventory.push(item);
                    }
                    addedMaterials.push(`${material.name}×${material.count}`);
                }
            } catch (error) {
                console.error(`添加材料 ${material.name} 时发生错误:`, error);
            }
        });
        
        // 显示浮动效果
        if (this.characters.length > 0) {
            const character = this.characters[0];
            this.showFloatingText(character.x, character.y - 40, '获得制作材料', '#FF6B35');
        }
        
        console.log(`🔨 开发者功能：添加制作材料 - ${addedMaterials.join(', ')}`);
    }
    
    // 新开发者功能：📓 获得经验笔记×10
    devAddExpNotes() {
        try {
            const expNoteData = ItemPresets.getPreset('experience_note');
            if (expNoteData) {
                for (let i = 0; i < 10; i++) {
                    const item = new Item(expNoteData);
                    this.inventory.push(item);
                }
                
                // 显示浮动效果
                if (this.characters.length > 0) {
                    const character = this.characters[0];
                    this.showFloatingText(character.x, character.y - 40, '获得经验笔记×10', '#4A90E2');
                }
                
                console.log(`📓 开发者功能：获得经验笔记×10`);
            } else {
                console.error('❌ 经验笔记预设不存在');
            }
        } catch (error) {
            console.error('添加经验笔记时发生错误:', error);
        }
    }
    
    // 新开发者功能：🍽️ 获得所有食物
    devGetAllFoods() {
        try {
            // 基础食物
            const basicFoods = [
                'rice', 'milk', 'tomato', 'chicken_leg', 'tea',
                'steak', 'banana', 'ice_cream', 'beer',
                'carrot', 'potato', 'fish', 'mushroom'
            ];
            
            // 菜肴（高级食物）
            const cuisines = [
                'grilled_fish', 'vegetable_stew', 'mushroom_soup', 'roasted_chicken',
                'fruit_salad', 'seafood_platter', 'premium_steak', 'royal_feast',
                'dragon_hotpot', 'magic_cake'
            ];
            
            let addedCount = 0;
            
            // 添加基础食物各100个
            basicFoods.forEach(foodId => {
                const foodData = ItemPresets.getPreset(foodId);
                if (foodData) {
                    for (let i = 0; i < 100; i++) {
                        const item = new Item(foodData);
                        this.inventory.push(item);
                    }
                    addedCount += 100;
                    console.log(`🍽️ 添加 ${foodData.name} ×100`);
                }
            });
            
            // 添加菜肴各100个
            cuisines.forEach(cuisineId => {
                const cuisineData = ItemPresets.getPreset(cuisineId);
                if (cuisineData) {
                    for (let i = 0; i < 100; i++) {
                        const item = new Item(cuisineData);
                        this.inventory.push(item);
                    }
                    addedCount += 100;
                    console.log(`🍽️ 添加 ${cuisineData.name} ×100`);
                }
            });
            
            // 显示浮动效果
            if (this.characters.length > 0) {
                const character = this.characters[0];
                this.showFloatingText(character.x, character.y - 40, `获得所有食物×100`, '#FF9800');
            }
            
            console.log(`🍽️ 开发者功能：获得所有食物，共添加 ${addedCount} 个物品`);
        } catch (error) {
            console.error('添加食物时发生错误:', error);
        }
    }
    
    // 添加投射物
    addProjectile(projectile) {
        this.projectiles.push(projectile);
        console.log(`添加投射物: ${projectile.icon} 来源: ${projectile.source.getDisplayName()}`);
    }
    
    // 添加雷击效果
    addLightningEffect(x, y) {
        if (!this.lightningEffects) {
            this.lightningEffects = [];
        }
        
        const effect = {
            x: x,
            y: y,
            startTime: Date.now(),
            duration: 3000,
            icon: '⚡',
            startY: y
        };
        
        this.lightningEffects.push(effect);
    }
    
    // 更新雷击效果
    updateLightningEffects() {
        if (!this.lightningEffects) return;
        
        const currentTime = Date.now();
        
        // 更新每个雷击效果
        this.lightningEffects.forEach(effect => {
            const elapsed = currentTime - effect.startTime;
            const progress = elapsed / effect.duration;
            
            if (progress <= 1) {
                // 向上漂浮
                effect.y = effect.startY - (progress * 60);
                // 淡出效果
                effect.opacity = 1.0 - progress;
            }
        });
        
        // 移除过期的效果
        this.lightningEffects = this.lightningEffects.filter(effect => {
            const elapsed = currentTime - effect.startTime;
            return elapsed < effect.duration;
        });
    }
    
    // 更新尖刺陷阱
    updateSpikeTraps() {
        if (!this.spikeTraps) return;
        
        const currentTime = Date.now();
        
        // 更新每个陷阱
        this.spikeTraps.forEach(trap => {
            // 检查陷阱是否应该造成伤害
            if (currentTime - trap.lastDamageTime >= trap.damageInterval) {
                // 检查范围内的敌人
                this.enemies.forEach(enemy => {
                    const distance = Math.sqrt(
                        Math.pow(enemy.x - trap.x, 2) + 
                        Math.pow(enemy.y - trap.y, 2)
                    );
                    
                    if (distance <= trap.radius) {
                        // 计算伤害：攻击力 * 40%
                        const damage = Math.floor(trap.creator.secondaryAttributes.attackPower * 0.4);
                        const actualDamage = this.calculateDamage(damage, enemy.defense);
                        
                        enemy.currentHealth -= actualDamage;
                        
                        // 显示伤害数字
                        this.showDamageNumber(enemy.x, enemy.y - enemy.radius - 10, actualDamage, 'player');
                        
                        // 检查敌人是否死亡
                        if (enemy.currentHealth <= 0) {
                            this.handleEnemyDeath(enemy, trap.creator);
                        }
                    }
                });
                
                trap.lastDamageTime = currentTime;
            }
        });
        
        // 移除过期的陷阱
        this.spikeTraps = this.spikeTraps.filter(trap => {
            const elapsed = currentTime - trap.startTime;
            return elapsed < trap.duration;
        });
    }
    
    // 更新治疗区域
    updateHealingZones() {
        if (!this.healingZones) return;
        
        const currentTime = Date.now();
        
        // 更新每个治疗区域
        this.healingZones.forEach(zone => {
            // 检查治疗区域是否应该治疗
            if (currentTime - zone.lastHealTime >= zone.healInterval) {
                // 检查范围内的玩家角色
                this.battleTeam.forEach(character => {
                    if (!character || character.isDead) return;
                    
                    const distance = Math.sqrt(
                        Math.pow(character.x - zone.x, 2) + 
                        Math.pow(character.y - zone.y, 2)
                    );
                    
                    if (distance <= zone.radius) {
                        // 计算治疗量：1 + 攻击力 * 10% + 技巧 * 25%
                        const healAmount = 1 + 
                            Math.floor(zone.creator.secondaryAttributes.attackPower * 0.1) + 
                            Math.floor(zone.creator.attributes.skill * 0.25);
                        
                        character.currentHealth = Math.min(character.maxHealth, character.currentHealth + healAmount);
                        
                        // 显示治疗数字
                        this.showDamageNumber(character.x, character.y - character.radius - 10, healAmount, 'healing');
                    }
                });
                
                zone.lastHealTime = currentTime;
            }
        });
        
        // 移除过期的治疗区域
        this.healingZones = this.healingZones.filter(zone => {
            const elapsed = currentTime - zone.startTime;
            return elapsed < zone.duration;
        });
    }
    
    // 更新践踏效果
    updateStompEffects() {
        if (!this.stompEffects) return;
        
        const currentTime = Date.now();
        
        // 移除过期的践踏效果
        this.stompEffects = this.stompEffects.filter(effect => {
            const elapsed = currentTime - effect.startTime;
            return elapsed < effect.duration;
        });
    }
    
    // 更新投射物
    updateProjectiles() {
        // 从后往前遍历，避免删除元素时索引问题
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // 更新投射物位置
            projectile.update(1000 / 60); // 假设60FPS
            
            // 检查是否过期
            if (projectile.isExpired()) {
                this.projectiles.splice(i, 1);
                console.log(`投射物 ${projectile.icon} 已过期`);
                continue;
            }
            
            // 检查与敌人的碰撞
            let hitTarget = false;
            this.enemies.forEach(enemy => {
                if (projectile.checkCollision(enemy) && projectile.canDamageTarget(enemy)) {
                    // 造成伤害
                    const actualDamage = enemy.takeDamage(projectile.damage);
                    
                    // 显示伤害数字
                    this.showDamageNumber(enemy.x, enemy.y - enemy.radius - 10, actualDamage, 'player');
                    
                    // 如果是火球术，施加燃烧状态
                    if (projectile.applyBurning && projectile.source) {
                        const burningDamagePerTick = Math.floor(projectile.source.secondaryAttributes.attackPower * projectile.burningDamagePercent);
                        
                        // 创建燃烧状态效果
                        const burningEffect = new StatusEffect({
                            id: 'burning',
                            name: '燃烧',
                            icon: '🔥',
                            duration: 6000, // 持续6秒
                            damagePerTick: burningDamagePerTick,
                            tickInterval: 1000, // 每秒造成一次伤害
                            source: projectile.source
                        });
                        
                        // 为敌人添加燃烧状态
                        if (enemy.addStatusEffect) {
                            enemy.addStatusEffect(burningEffect);
                            console.log(`${enemy.name} 被施加燃烧状态，每秒受到 ${burningDamagePerTick} 伤害`);
                        }
                    }
                    
                    console.log(`投射物 ${projectile.icon} 击中 ${enemy.name}，造成 ${actualDamage} 伤害`);
                    
                    // 检查敌人是否死亡
                    if (enemy.currentHealth <= 0) {
                        this.handleEnemyDeath(enemy, projectile.source);
                    }
                    
                    // 只有非穿透投射物才会被移除
                    if (!projectile.isPenetrating) {
                        this.projectiles.splice(i, 1);
                        hitTarget = true;
                    }
                }
            });
        }
    }
    
    // 更新角色拖尾效果
    updateCharacterTrails() {
        // 更新所有角色的拖尾轨迹
        this.battleTeam.forEach(character => {
            if (character && character.hasStatusEffect && character.hasStatusEffect('charge')) {
                // 为冲锋状态的角色记录轨迹
                if (!this.characterTrails.has(character)) {
                    this.characterTrails.set(character, []);
                }
                
                const trail = this.characterTrails.get(character);
                
                // 添加当前位置到轨迹
                trail.push({
                    x: character.x,
                    y: character.y,
                    timestamp: Date.now()
                });
                
                // 保持轨迹长度，移除过旧的点（超过1000ms的点）
                const now = Date.now();
                while (trail.length > 0 && now - trail[0].timestamp > 1000) {
                    trail.shift();
                }
            } else {
                // 非冲锋状态，清除轨迹
                if (this.characterTrails.has(character)) {
                    this.characterTrails.delete(character);
                }
            }
        });
    }
    
    // 绘制角色拖尾效果
    drawCharacterTrails() {
        if (!this.ctx) return;
        
        this.characterTrails.forEach((trail, character) => {
            if (trail.length < 2) return;
            
            this.ctx.save();
            
            // 绘制拖尾轨迹
            for (let i = 1; i < trail.length; i++) {
                const current = trail[i];
                const previous = trail[i - 1];
                const now = Date.now();
                
                // 计算透明度（越新的点越不透明）
                const age = now - current.timestamp;
                const alpha = Math.max(0, 1 - age / 1000); // 1000ms内完全消失
                
                // 计算线条宽度（越新的点越粗）
                const width = Math.max(5, 20 * alpha); // 5倍大小：最粗20像素，最细5像素
                
                // 绘制拖尾线段
                this.ctx.strokeStyle = `rgba(0, 150, 255, ${alpha * 0.8})`; // 蓝色拖尾
                this.ctx.lineWidth = width;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(previous.x, previous.y);
                this.ctx.lineTo(current.x, current.y);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    // 绘制投射物
    drawProjectiles() {
        if (!this.ctx) return;
        
        this.projectiles.forEach(projectile => {
            this.ctx.save();
            
            // 绘制残影效果
            if (projectile.trail && projectile.trail.length > 0) {
                const currentTime = Date.now();
                
                projectile.trail.forEach((trailPoint, index) => {
                    // 计算透明度：越旧的残影越透明
                    const progress = index / projectile.trail.length;
                    const alpha = progress * 0.6; // 最大透明度60%
                    
                    // 计算大小：越旧的残影越小
                    const sizeScale = 0.5 + progress * 0.4; // 50%到90%的大小
                    
                    // 获取投射物的基础大小
                    let baseFontSize = 20;
                    if (projectile.isFireball) {
                        const currentSize = projectile.getCurrentSize();
                        baseFontSize = Math.floor(20 * (currentSize / projectile.initialSize));
                    } else if (projectile.sizeMultiplier) {
                        baseFontSize = Math.floor(20 * projectile.sizeMultiplier);
                    }
                    
                    const trailFontSize = Math.floor(baseFontSize * sizeScale);
                    
                    // 绘制残影
                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;
                    this.ctx.font = `${trailFontSize}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillStyle = '#666'; // 灰色残影
                    this.ctx.fillText(projectile.icon, trailPoint.x, trailPoint.y);
                    this.ctx.restore();
                });
            }
            
            // 火球特殊效果：随时间放大
            if (projectile.isFireball) {
                const currentSize = projectile.getCurrentSize();
                const fontSize = Math.floor(20 * (currentSize / projectile.initialSize));
                this.ctx.font = `${fontSize}px Arial`;
            } else {
                // 应用大小倍率（如果有）
                const sizeMultiplier = projectile.sizeMultiplier || 1;
                const fontSize = Math.floor(20 * sizeMultiplier);
                this.ctx.font = `${fontSize}px Arial`;
            }
            
            // 绘制投射物图标
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#000';
            this.ctx.fillText(projectile.icon, projectile.x, projectile.y);
            
            this.ctx.restore();
        });
    }
    
    // 绘制雷击效果
    drawLightningEffects() {
        if (!this.ctx || !this.lightningEffects) return;
        
        this.lightningEffects.forEach(effect => {
            this.ctx.save();
            
            // 设置透明度
            this.ctx.globalAlpha = effect.opacity || 1.0;
            
            // 绘制雷击符号
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#FFD700'; // 金色
            this.ctx.fillText(effect.icon, effect.x, effect.y);
            
            this.ctx.restore();
        });
    }
    
    // 绘制尖刺陷阱
    drawSpikeTraps() {
        if (!this.ctx || !this.spikeTraps) return;
        
        this.spikeTraps.forEach(trap => {
            this.ctx.save();
            
            // 绘制陷阱圆圈
            this.ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'; // 灰色半透明
            this.ctx.beginPath();
            this.ctx.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制边框
            this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 绘制中心图标
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#666';
            this.ctx.fillText('📌', trap.x, trap.y);
            
            this.ctx.restore();
        });
    }
    
    // 绘制治疗区域
    drawHealingZones() {
        if (!this.ctx || !this.healingZones) return;
        
        this.healingZones.forEach(zone => {
            this.ctx.save();
            
            // 绘制治疗区域圆圈
            this.ctx.fillStyle = 'rgba(144, 238, 144, 0.3)'; // 淡绿色半透明
            this.ctx.beginPath();
            this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制边框
            this.ctx.strokeStyle = 'rgba(144, 238, 144, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 绘制中心图标
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#90EE90';
            this.ctx.fillText('💚', zone.x, zone.y);
            
            this.ctx.restore();
        });
    }
    
    // 绘制践踏效果
    drawStompEffects() {
        if (!this.ctx || !this.stompEffects) return;
        
        this.stompEffects.forEach(effect => {
            this.ctx.save();
            
            // 计算淡出透明度
            const elapsed = Date.now() - effect.startTime;
            const progress = elapsed / effect.duration;
            const opacity = Math.max(0, 1 - progress);
            
            // 绘制践踏区域圆圈
            this.ctx.fillStyle = `rgba(255, 165, 0, ${opacity * 0.4})`; // 橙色半透明
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制边框
            this.ctx.strokeStyle = `rgba(255, 165, 0, ${opacity * 0.8})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    // 绘制护盾效果
    drawShieldEffects() {
        if (!this.ctx) return;
        
        // 为有护盾的角色绘制护盾圆圈
        this.battleTeam.forEach(character => {
            if (!character || character.isDead) return;
            
            // 检查角色是否有护盾状态效果
            let hasShield = false;
            if (character.statusEffects) {
                hasShield = character.statusEffects.some(effect => 
                    effect.effects && effect.effects.shield && effect.effects.shield > 0
                );
            }
            
            if (hasShield && character.x !== undefined && character.y !== undefined) {
                this.ctx.save();
                
                // 设置线性减淡模式
                this.ctx.globalCompositeOperation = 'screen';
                
                // 绘制护盾圆圈
                this.ctx.strokeStyle = 'rgba(173, 216, 230, 0.8)'; // 淡蓝色
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(character.x, character.y, character.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        });
    }
    
    // 寻找最近的敌人
    findNearestEnemy(character) {
        if (this.enemies.length === 0) return null;
        
        let nearestEnemy = null;
        let minDistance = Infinity;
        
        this.enemies.forEach(enemy => {
            const distance = Math.sqrt(
                Math.pow(character.x - enemy.x, 2) + 
                Math.pow(character.y - enemy.y, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        return nearestEnemy;
    }
    
    // 寻找生命值最低的队友
    findLowestHealthAlly(character) {
        let lowestHealthAlly = null;
        let lowestHealthPercent = 1;
        
        // 包括自己在内的所有队友
        this.battleTeam.forEach(ally => {
            if (ally && ally.type === 'Player' && ally.currentHealth > 0 && !ally.isDead) {
                const healthPercent = ally.currentHealth / ally.maxHealth;
                if (healthPercent < lowestHealthPercent) {
                    lowestHealthPercent = healthPercent;
                    lowestHealthAlly = ally;
                }
            }
        });
        
        return lowestHealthAlly;
    }
    
    // 寻找随机队友
    findRandomAlly(character) {
        // 包括自己在内的所有队友
        const allies = this.battleTeam.filter(ally => 
            ally && ally.type === 'Player' && ally.currentHealth > 0 && !ally.isDead
        );
        
        if (allies.length === 0) return null;
        
        return allies[Math.floor(Math.random() * allies.length)];
    }
    
    // 激怒效果
    applyEnrage(character, game) {
        // 找到随机队友
        const randomAlly = this.findRandomAlly(character);
        if (!randomAlly) {
            console.log('没有找到队友，无法使用激怒');
            return;
        }
        
        // 添加激怒状态 (限制最大攻击力增长)
        const enrageEffect = new StatusEffect({
            id: 'enrage',
            name: '激怒',
            icon: '😠',
            duration: 8000,
            effects: {
                attackPowerMultiplier: 1.3 // 降低到30%增长，避免过高伤害
            },
            source: character
        });
        
        randomAlly.addStatusEffect(enrageEffect);
        
        // 恢复目标25点魔法值
        const manaRestore = 25;
        randomAlly.currentMana = Math.min(randomAlly.maxMana, randomAlly.currentMana + manaRestore);
        
        console.log(`${character.getDisplayName()} 激怒了 ${randomAlly.getDisplayName()}，攻击力增加50%，恢复${manaRestore}点魔法值`);
    }
    
    // 启动游戏循环
    startGameLoop() {
        // 防止重复启动游戏循环
        if (this.gameLoopRunning) {
            console.warn('游戏循环已在运行中，忽略重复启动请求');
            return;
        }
        
        this.gameLoopRunning = true;
        this.gameLoopId = null;
        
        const gameLoop = () => {
            // 检查是否应该停止游戏循环
            if (!this.gameLoopRunning) {
                console.log('游戏循环已停止');
                return;
            }
            
            try {
                // 更新投射物
                this.updateProjectiles();
                
                // 更新玩家角色
                this.updatePlayerCharacters();
                
                // 更新敌人
                this.updateEnemies();
                
                // 更新新BOSS系统
                this.bossManager.update();
                
                // 更新死亡角色的复活倒计时
                this.updateReviveCountdowns();
                
                // 更新伤害数字动画
                this.updateDamageNumbers();
                
                // 更新治疗效果动画
                this.updateHealingEffects();
                
                // 更新魔法恢复效果动画
                this.updateManaRestoreEffects();
                
                // 更新粒子系统
                this.updateParticles();
                
                // 更新掉落物效果动画
                this.updateItemDropEffects();
                
                // 更新关卡掉落物通知
                this.updateLevelDropNotifications();
                
                // 更新金币系统
                this.updateGoldSystem();
                
                // 更新角色拖尾效果
                this.updateCharacterTrails();
                
                // 更新资源点系统
                this.updateResourcePoints();
                
                // 更新新技能效果
                this.updateLightningEffects();
                this.updateSpikeTraps();
                this.updateHealingZones();
                this.updateStompEffects();
                
                // 更新战斗面板状态条（实时同步）
                this.updateBattlePanelBars();
                
                // 重绘画面
                this.drawLevel();
                
                // 继续下一帧
                this.gameLoopId = requestAnimationFrame(gameLoop);
                
            } catch (error) {
                console.error('游戏循环出错:', error);
                this.handleGameLoopError(error);
            }
        };
        
        // 开始游戏循环
        this.gameLoopId = requestAnimationFrame(gameLoop);
        console.log('游戏循环已启动');
    }
    
    // 停止游戏循环
    stopGameLoop() {
        this.gameLoopRunning = false;
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        console.log('游戏循环已停止');
    }
    
    // 设置页面可见性监听器
    setupVisibilityListener() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面被隐藏时，记录离开时间
                console.log('页面被隐藏，开始计算离线时间');
                this.isPageHidden = true;
                this.lastActiveTime = Date.now();
            } else {
                // 页面重新可见时，计算离线奖励
                console.log('页面重新可见，计算离线奖励');
                this.isPageHidden = false;
                this.calculateOfflineRewards();
                
                // 延迟检查游戏循环状态，给浏览器时间恢复
                setTimeout(() => {
                    this.checkAndRestoreGameLoop();
                }, 100);
            }
        });
        
        // 监听窗口焦点变化
        window.addEventListener('focus', () => {
            console.log('窗口获得焦点，计算离线奖励');
            this.isWindowFocused = true;
            this.calculateOfflineRewards();
            setTimeout(() => {
                this.checkAndRestoreGameLoop();
            }, 100);
        });
        
        window.addEventListener('blur', () => {
            console.log('窗口失去焦点，记录离开时间');
            this.isWindowFocused = false;
            this.lastActiveTime = Date.now();
        });
        
        // 初始化状态
        this.isPageHidden = document.hidden;
        this.isWindowFocused = document.hasFocus();
        
        console.log('页面可见性监听器已设置');
    }
    
    // 检查并恢复游戏循环
    checkAndRestoreGameLoop() {
        // 如果游戏循环已停止，尝试重启
        if (!this.gameLoopRunning) {
            console.log('检测到游戏循环已停止，尝试重启...');
            try {
                this.startGameLoop();
                console.log('游戏循环重启成功');
            } catch (error) {
                console.error('游戏循环重启失败:', error);
            }
        }
        
        // 设置定期检查机制，防止游戏循环意外停止
        if (!this.gameLoopWatchdog) {
            this.gameLoopWatchdog = setInterval(() => {
                // 只在页面可见且有焦点时检查
                if (!this.isPageHidden && this.isWindowFocused) {
                    if (!this.gameLoopRunning) {
                        console.log('看门狗检测到游戏循环停止，尝试重启...');
                        try {
                            this.startGameLoop();
                        } catch (error) {
                            console.error('看门狗重启游戏循环失败:', error);
                        }
                    }
                }
            }, 5000); // 每5秒检查一次
        }
    }
    
    // 处理游戏循环错误
    handleGameLoopError(error) {
        console.error('游戏循环发生严重错误:', error);
        
        // 尝试恢复
        try {
            // 清理可能导致问题的对象
            this.emergencyCleanup();
            
            // 重启游戏循环
            setTimeout(() => {
                if (!this.gameLoopRunning) {
                    console.log('尝试重启游戏循环...');
                    this.startGameLoop();
                }
            }, 1000);
            
        } catch (recoveryError) {
            console.error('游戏循环恢复失败:', recoveryError);
            this.stopGameLoop();
            
            // 显示错误信息给用户
            const errorMessage = `
                <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin: 10px 0; border: 1px solid #f5c6cb;">
                    <strong>游戏循环错误:</strong><br>
                    ${error.message}<br>
                    <small>游戏已自动停止以防止崩溃，请刷新页面重试</small><br>
                    <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            `;
            
            const panelContent = document.querySelector('.panel-content');
            const controlContent = document.querySelector('.control-content');
            
            if (panelContent) panelContent.innerHTML = errorMessage;
            if (controlContent) controlContent.innerHTML = errorMessage;
        }
    }
    
    // 紧急清理
    emergencyCleanup() {
        console.log('执行紧急清理...');
        
        try {
            // 清理数组，但保留少量元素以维持游戏状态
            if (this.enemies && this.enemies.length > 20) {
                this.enemies = this.enemies.slice(-10); // 只保留最后10个敌人
            }
            
            if (this.projectiles && this.projectiles.length > 50) {
                this.projectiles = this.projectiles.slice(-20); // 只保留最后20个投射物
            }
            
            if (this.damageNumbers && this.damageNumbers.length > 30) {
                this.damageNumbers = this.damageNumbers.slice(-10); // 只保留最后10个伤害数字
            }
            
            if (this.healingEffects && this.healingEffects.length > 20) {
                this.healingEffects = this.healingEffects.slice(-5); // 只保留最后5个治疗效果
            }
            
            if (this.manaRestoreEffects && this.manaRestoreEffects.length > 20) {
                this.manaRestoreEffects = this.manaRestoreEffects.slice(-5);
            }
            
            if (this.itemDropEffects && this.itemDropEffects.length > 20) {
                this.itemDropEffects = this.itemDropEffects.slice(-5);
            }
            
            // 清理拖尾轨迹
            if (this.characterTrails) {
                this.characterTrails.clear();
            }
            
            // 重置危机值
            this.crisisValue = 0;
            
            console.log('紧急清理完成');
            
        } catch (cleanupError) {
            console.error('紧急清理失败:', cleanupError);
        }
    }
    
    // 处理敌人边界碰撞
    handleEnemyBoundaryCollision(enemy, moveDistance) {
        let hitBoundary = false;
        
        if (enemy.x - enemy.radius <= 0 || enemy.x + enemy.radius >= this.canvas.width) {
            enemy.x = Math.max(enemy.radius, Math.min(this.canvas.width - enemy.radius, enemy.x));
            hitBoundary = true;
        }
        
        if (enemy.y - enemy.radius <= 0 || enemy.y + enemy.radius >= this.canvas.height) {
            enemy.y = Math.max(enemy.radius, Math.min(this.canvas.height - enemy.radius, enemy.y));
            hitBoundary = true;
        }
        
        // 如果触碰到边界，重新选择随机方向
        if (hitBoundary) {
            const angle = Math.random() * 2 * Math.PI;
            enemy.directionX = Math.cos(angle);
            enemy.directionY = Math.sin(angle);
        }
    }
    
    // 更新复活倒计时
    updateReviveCountdowns() {
        this.characters.forEach(character => {
            if (character.isDead && character.reviveCountdown > 0) {
                const currentTime = Date.now();
                const elapsed = (currentTime - character.deathTime) / 1000; // 转换为秒
                character.reviveCountdown = Math.max(0, 30 - elapsed);
                
                // 检查是否应该复活
                if (character.reviveCountdown <= 0) {
                    this.reviveCharacter(character);
                }
            }
        });
    }
    
    // 添加初始物品
    addInitialItems() {
        console.log('正在添加初始物品...');
        
        // 添加4个蛋
        for (let i = 0; i < 4; i++) {
            const egg = new Egg(ItemPresets.getPreset('dirty_egg'));
            this.inventory.push(egg);
        }
        console.log('添加了4个脏兮兮的蛋');
        
        // 添加32个米饭
        for (let i = 0; i < 32; i++) {
            const rice = new Item(ItemPresets.getPreset('rice'));
            this.inventory.push(rice);
        }
        console.log('添加了32个米饭');
        
        // 材料物品已移除 - 不再添加初始材料
        
        // 添加每种技能书10个
        const skillBookTypes = ['savage_charge_book', 'heavy_punch_book', 'emergency_bandage_book', 'enrage_book'];
        skillBookTypes.forEach(bookType => {
            for (let i = 0; i < 10; i++) {
                const skillBook = new Item(ItemPresets.getPreset(bookType));
                this.inventory.push(skillBook);
            }
        });
        console.log('添加了每种技能书10个');
        
        console.log(`初始物品添加完成，背包总物品数: ${this.inventory.length}`);
        console.log(`初始金币: ${this.gold}`);
    }
    
    // 显示技能选择面板
    showSkillSelectionPanel(character, slotIndex) {
        console.log(`准备显示技能选择面板，角色: ${character.getDisplayName()}，槽位: ${slotIndex + 1}`);
        
        // 检查技能槽是否被锁定
        if (character.skillSlotLocks[slotIndex]) {
            console.log(`技能槽位 ${slotIndex + 1} 被锁定，无法操作`);
            return;
        }
        
        // 检查是否已存在模态框，如果存在则先关闭
        const existingModal = document.querySelector('.skill-selection-modal');
        if (existingModal) {
            console.log('发现已存在的技能选择面板，先关闭');
            this.closeSkillSelectionPanel(existingModal);
        }
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'skill-selection-modal';
        
        modal.innerHTML = `
            <div class="skill-selection-panel">
                <div class="skill-selection-header">
                    <div class="skill-selection-title">技能选择 - 槽位 ${slotIndex + 1}</div>
                    <button class="close-skill-selection-btn">×</button>
                </div>
                
                <div class="skill-selection-tabs">
                    <button class="skill-selection-tab active" data-tab="learned">已学技能</button>
                    <button class="skill-selection-tab" data-tab="books">技能书</button>
                </div>
                
                <div class="skill-selection-content">
                    <div id="learned-skills-content">
                        <div class="learned-skills-grid" id="learned-skills-grid">
                            <div style="text-align: center; color: #999; padding: 20px;">正在加载技能...</div>
                        </div>
                    </div>
                    
                    <div id="skill-books-content" style="display: none;">
                        <div class="skill-book-grid" id="skill-book-grid">
                            <div style="text-align: center; color: #999; padding: 20px;">正在加载技能书...</div>
                        </div>
                        <div class="skill-selection-pagination" id="skill-books-pagination"></div>
                    </div>
                </div>
            </div>
        `;
        
        // 设置状态变量
        this.currentSkillSelectionCharacter = character;
        this.currentSkillSelectionSlot = slotIndex;
        this.skillBookPage = 0;
        
        // 添加到DOM
        document.body.appendChild(modal);
        console.log('技能选择面板已添加到DOM');
        
        // 立即绑定事件
        this.bindSkillSelectionEvents(modal);
        
        // 延迟更新内容，确保DOM完全渲染
        setTimeout(() => {
            this.updateSkillSelectionContent('learned');
        }, 50);
        
        console.log(`技能选择面板初始化完成`);
    }
    
    // 绑定技能选择面板事件
    bindSkillSelectionEvents(modal) {
        // 关闭按钮
        modal.querySelector('.close-skill-selection-btn').addEventListener('click', () => {
            this.closeSkillSelectionPanel(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeSkillSelectionPanel(modal);
            }
        });
        
        // 标签切换
        modal.querySelectorAll('.skill-selection-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                
                // 更新标签状态
                modal.querySelectorAll('.skill-selection-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 更新内容
                this.updateSkillSelectionContent(tabType);
            });
        });
    }
    
    // 更新技能选择面板内容
    updateSkillSelectionContent(tabType) {
        const learnedContent = document.getElementById('learned-skills-content');
        const booksContent = document.getElementById('skill-books-content');
        
        console.log(`更新技能选择面板内容，标签类型: ${tabType}`);
        
        if (!learnedContent || !booksContent) {
            console.error('技能选择面板内容区域未找到，延迟重试');
            setTimeout(() => {
                this.updateSkillSelectionContent(tabType);
            }, 100);
            return;
        }
        
        // 同步更新标签页的视觉状态
        const modal = document.querySelector('.skill-selection-modal');
        if (modal) {
            const tabs = modal.querySelectorAll('.skill-tab');
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.tab === tabType) {
                    tab.classList.add('active');
                }
            });
            console.log(`标签页状态已更新为: ${tabType}`);
        }
        
        if (tabType === 'learned') {
            learnedContent.style.display = 'block';
            booksContent.style.display = 'none';
            this.updateLearnedSkillsGrid();
        } else {
            learnedContent.style.display = 'none';
            booksContent.style.display = 'block';
            this.updateSkillBooksGrid();
        }
    }
    
    // 更新已学技能网格
    updateLearnedSkillsGrid() {
        const grid = document.getElementById('learned-skills-grid');
        const character = this.currentSkillSelectionCharacter;
        
        console.log(`更新已学技能网格`);
        console.log(`当前角色: ${character ? character.getDisplayName() : '无'}`);
        
        if (!character) {
            console.error('当前技能选择角色未设置');
            return;
        }
        
        if (!grid) {
            console.error('技能网格元素未找到');
            return;
        }
        
        console.log(`角色已学技能数量: ${character.learnedSkills.length}`);
        console.log(`已学技能详情:`, character.learnedSkills.map(s => ({name: s.name, id: s.id, type: s.type})));
        
        grid.innerHTML = '';
        
        // 添加"卸下技能"选项
        const currentSkill = character.skills[this.currentSkillSelectionSlot];
        if (currentSkill) {
            const unequipCard = document.createElement('div');
            unequipCard.className = 'learned-skill-card unequip-card';
            
            unequipCard.innerHTML = `
                <div class="skill-card-header">
                    <div class="skill-card-icon">❌</div>
                    <div class="skill-card-info">
                        <div class="skill-card-name">卸下技能</div>
                        <div class="skill-card-type">移除当前装备的技能</div>
                    </div>
                </div>
                <div class="skill-card-description">点击卸下槽位 ${this.currentSkillSelectionSlot + 1} 中的技能：${currentSkill.name}</div>
            `;
            
            // 点击事件
            unequipCard.addEventListener('click', () => {
                console.log(`卸下技能: ${currentSkill.name}`);
                character.skills[this.currentSkillSelectionSlot] = null;
                
                // 卸下技能后重新计算属性
                character.updateAttributes();
                
                // 关闭面板并刷新UI
                const modal = document.querySelector('.skill-selection-modal');
                if (modal) {
                    this.closeSkillSelectionPanel(modal);
                }
                this.refreshCurrentPanel();
                
                // 如果角色详情面板是打开的，也需要刷新它
                const characterDetailModal = document.querySelector('.character-detail-modal');
                if (characterDetailModal) {
                    console.log('检测到角色详情面板已打开，刷新技能槽显示');
                    this.refreshCharacterDetailSkillSlots(characterDetailModal, character);
                }
            });
            
            grid.appendChild(unequipCard);
            console.log('添加了卸下技能选项');
        }
        
        if (character.learnedSkills.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = 'grid-column: 1/-1; text-align: center; color: #999; padding: 40px;';
            emptyMessage.textContent = '暂无已学技能';
            grid.appendChild(emptyMessage);
            console.log('显示暂无已学技能提示');
            return;
        }
        
        // 显示已学技能
        character.learnedSkills.forEach((skill, index) => {
            console.log(`处理技能 ${index + 1}: ${skill.name}`);
            
            const isEquipped = character.skills.includes(skill);
            const isCurrentSlot = character.skills[this.currentSkillSelectionSlot] && 
                                character.skills[this.currentSkillSelectionSlot].id === skill.id;
            const card = document.createElement('div');
            card.className = `learned-skill-card ${isEquipped ? 'equipped' : ''} ${isCurrentSlot ? 'current-slot' : ''}`;
            
            try {
                card.innerHTML = `
                    <div class="skill-card-header">
                        <div class="skill-card-icon">${skill.icon}</div>
                        <div class="skill-card-info">
                            <div class="skill-card-name">${skill.name}</div>
                            <div class="skill-card-type">${skill.getTypeText()}</div>
                        </div>
                    </div>
                    <div class="skill-card-description">${skill.description}</div>
                    ${isCurrentSlot ? '<div class="skill-status">当前槽位</div>' : ''}
                    ${isEquipped && !isCurrentSlot ? '<div class="skill-status">已装备在其他槽位</div>' : ''}
                `;
                
                // 点击事件
                card.addEventListener('click', () => {
                    console.log(`点击技能卡片: ${skill.name}`);
                    this.equipSkillToSlot(skill, character, this.currentSkillSelectionSlot);
                });
                
                grid.appendChild(card);
                console.log(`添加技能卡片: ${skill.name} (${isEquipped ? '已装备' : '未装备'})`);
                
            } catch (error) {
                console.error(`创建技能卡片时出错 (${skill.name}):`, error);
                
                // 创建简化版本的卡片
                card.innerHTML = `
                    <div class="skill-card-header">
                        <div class="skill-card-icon">${skill.icon || '⚔️'}</div>
                        <div class="skill-card-info">
                            <div class="skill-card-name">${skill.name || '未知技能'}</div>
                            <div class="skill-card-type">技能</div>
                        </div>
                    </div>
                    <div class="skill-card-description">${skill.description || '无描述'}</div>
                `;
                
                card.addEventListener('click', () => {
                    console.log(`点击技能卡片: ${skill.name}`);
                    this.equipSkillToSlot(skill, character, this.currentSkillSelectionSlot);
                });
                
                grid.appendChild(card);
            }
        });
        
        console.log(`已学技能网格更新完成，共添加 ${character.learnedSkills.length} 个技能卡片`);
    }
    
    // 更新技能书网格
    updateSkillBooksGrid() {
        const grid = document.getElementById('skill-book-grid');
        const pagination = document.getElementById('skill-books-pagination');
        const character = this.currentSkillSelectionCharacter;
        
        if (!character || !grid) {
            console.error('技能书网格更新失败：缺少必要元素');
            return;
        }
        
        // 获取技能书物品
        const skillBooks = this.inventory.filter(item => 
            item.type === '书' && item.skillId
        );
        
        console.log(`找到技能书数量: ${skillBooks.length}`);
        
        // 将技能书按名称分组并计数
        const groupedSkillBooks = {};
        skillBooks.forEach(item => {
            if (groupedSkillBooks[item.name]) {
                groupedSkillBooks[item.name].count++;
                groupedSkillBooks[item.name].items.push(item);
            } else {
                groupedSkillBooks[item.name] = {
                    item: item,
                    count: 1,
                    items: [item]
                };
            }
        });
        
        const uniqueSkillBooks = Object.values(groupedSkillBooks);
        console.log(`技能书种类数量: ${uniqueSkillBooks.length}`);
        
        // 分页设置
        const itemsPerPage = 6;
        const totalPages = Math.max(1, Math.ceil(uniqueSkillBooks.length / itemsPerPage));
        
        // 确保当前页面在有效范围内
        if (this.skillBookPage >= totalPages) {
            this.skillBookPage = Math.max(0, totalPages - 1);
        }
        
        const startIndex = this.skillBookPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = uniqueSkillBooks.slice(startIndex, endIndex);
        
        // 更新网格
        grid.innerHTML = '';
        
        if (uniqueSkillBooks.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">暂无技能书</div>';
        } else {
            pageItems.forEach(itemData => {
                const item = itemData.item;
                const count = itemData.count;
                const canUse = !character.hasLearnedSkill(item.skillId);
                const card = document.createElement('div');
                card.className = `skill-book-card ${canUse ? '' : 'unusable'}`;
                
                card.innerHTML = `
                    <div class="skill-card-header">
                        <div class="skill-card-icon">${item.icon}</div>
                        <div class="skill-card-info">
                            <div class="skill-card-name">${item.name}</div>
                            <div class="skill-card-type">${item.type} ${count > 1 ? `×${count}` : ''}</div>
                        </div>
                    </div>
                    <div class="skill-card-description">${item.description}</div>
                    ${!canUse ? '<div style="color: #ff4444; font-size: 11px; margin-top: 5px;">已学会此技能</div>' : ''}
                `;
                
                // 点击事件
                if (canUse) {
                    card.addEventListener('click', () => {
                        console.log(`在技能选择面板中使用技能书: ${item.name} (剩余${count}个)`);
                        this.useSkillBookOnCharacter(item, character);
                    });
                } else {
                    card.style.cursor = 'not-allowed';
                    card.style.opacity = '0.6';
                }
                
                grid.appendChild(card);
            });
        }
        
        // 更新分页
        this.updateSkillBooksPagination(pagination, totalPages);
        
        console.log(`技能书网格更新完成，显示 ${pageItems.length} 种技能书`);
    }
    
    // 更新技能书分页
    updateSkillBooksPagination(pagination, totalPages) {
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.className = 'skill-selection-page-btn';
        prevBtn.textContent = '上一页';
        prevBtn.disabled = this.skillBookPage === 0;
        prevBtn.addEventListener('click', () => {
            if (this.skillBookPage > 0) {
                this.skillBookPage--;
                this.updateSkillBooksGrid();
            }
        });
        pagination.appendChild(prevBtn);
        
        // 页码信息
        const pageInfo = document.createElement('span');
        pageInfo.className = 'skill-selection-page-info';
        pageInfo.textContent = `${this.skillBookPage + 1} / ${totalPages}`;
        pagination.appendChild(pageInfo);
        
        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.className = 'skill-selection-page-btn';
        nextBtn.textContent = '下一页';
        nextBtn.disabled = this.skillBookPage >= totalPages - 1;
        nextBtn.addEventListener('click', () => {
            if (this.skillBookPage < totalPages - 1) {
                this.skillBookPage++;
                this.updateSkillBooksGrid();
            }
        });
        pagination.appendChild(nextBtn);
    }
    
    // 装备技能到槽位
    equipSkillToSlot(skill, character, slotIndex) {
        // 如果点击的是已装备的技能，则卸下它
        if (character.skills[slotIndex] && character.skills[slotIndex].id === skill.id) {
            character.skills[slotIndex] = null;
            console.log(`${character.getDisplayName()} 卸下了技能 ${skill.name} 从槽位 ${slotIndex + 1}`);
        } else {
            // 如果技能已经装备在其他槽位，先卸下
            const currentSlotIndex = character.skills.findIndex(s => s && s.id === skill.id);
            if (currentSlotIndex !== -1) {
                character.skills[currentSlotIndex] = null;
            }
            
            // 装备到目标槽位
            character.skills[slotIndex] = skill;
            console.log(`${character.getDisplayName()} 装备技能 ${skill.name} 到槽位 ${slotIndex + 1}`);
        }
        
        // 装备/卸下技能后重新计算属性
        character.updateAttributes();
        
        // 立即更新所有相关UI - 在关闭面板之前
        const characterDetailModal = document.querySelector('.character-detail-modal');
        if (characterDetailModal) {
            console.log('立即刷新角色详情面板技能槽显示');
            this.refreshCharacterDetailSkillSlots(characterDetailModal, character);
        }
        
        // 立即更新当前面板
        this.refreshCurrentPanel();
        
        // 如果当前角色是装备技能的角色，立即刷新角色面板
        if (this.currentCharacter && this.currentCharacter === character) {
            console.log('立即刷新角色面板以显示装备的技能');
            this.initCharacterPanel();
        }
        
        // 关闭技能选择面板
        const modal = document.querySelector('.skill-selection-modal');
        if (modal) {
            this.closeSkillSelectionPanel(modal);
        }
    }
    
    // 在角色身上使用技能书
    useSkillBookOnCharacter(skillBook, character) {
        console.log(`尝试在角色 ${character.getDisplayName()} 身上使用技能书 ${skillBook.name}`);
        console.log(`技能书skillId: ${skillBook.skillId}`);
        console.log(`角色当前已学技能数量: ${character.learnedSkills.length}`);
        
        const success = character.useSkillBook(skillBook);
        console.log(`技能书使用结果: ${success}`);
        
        if (success) {
            console.log(`技能学习成功，角色现在已学技能数量: ${character.learnedSkills.length}`);
            
            // 从背包中移除技能书
            const itemIndex = this.inventory.indexOf(skillBook);
            if (itemIndex > -1) {
                this.inventory.splice(itemIndex, 1);
                console.log(`技能书 ${skillBook.name} 已从背包中移除`);
            }
            
            // 显示成功视觉效果
            console.log('准备显示成功视觉效果');
            this.showSkillBookSuccessEffect(skillBook, character);
            
            // 立即更新技能选择面板内容
            const modal = document.querySelector('.skill-selection-modal');
            if (modal) {
                console.log('技能书使用成功，立即更新技能选择面板');
                
                // 确保显示已学技能标签页
                const learnedTab = modal.querySelector('.skill-tab[data-tab="learned"]');
                const booksTab = modal.querySelector('.skill-tab[data-tab="books"]');
                const learnedContent = document.getElementById('learned-skills-content');
                const booksContent = document.getElementById('skill-books-content');
                
                if (learnedTab && booksTab) {
                    learnedTab.classList.add('active');
                    booksTab.classList.remove('active');
                }
                
                if (learnedContent && booksContent) {
                    learnedContent.style.display = 'block';
                    booksContent.style.display = 'none';
                }
                
                // 更新已学技能内容
                this.updateSkillSelectionContent('learned');
            }
            
            // 刷新当前面板
            this.refreshCurrentPanel();
            
            console.log(`${character.getDisplayName()} 使用技能书学会了新技能`);
        } else {
            console.log('技能书使用失败');
        }
        
        return success;
    }
    
    // 显示技能书使用成功的视觉效果
    showSkillBookSuccessEffect(skillBook, character) {
        // 创建成功效果模态框
        const effectModal = document.createElement('div');
        effectModal.className = 'skill-book-success-modal';
        
        effectModal.innerHTML = `
            <div class="skill-book-success-panel">
                <div class="success-header">
                    <div class="success-icon">✨</div>
                    <div class="success-title">技能学习成功！</div>
                </div>
                
                <div class="success-content">
                    <div class="character-info">
                        <div class="character-avatar">${character.avatar}</div>
                        <div class="character-name">${character.getDisplayName()}</div>
                    </div>
                    
                    <div class="skill-learned">
                        <div class="learned-text">学会了新技能</div>
                        <div class="skill-display">
                            <div class="skill-icon">${SkillPresets.getPreset(skillBook.skillId)?.icon || '⚔️'}</div>
                            <div class="skill-name">${SkillPresets.getPreset(skillBook.skillId)?.name || '未知技能'}</div>
                        </div>
                    </div>
                    
                    <div class="success-stats">
                        <div class="stat-item">
                            <span class="stat-label">已学技能:</span>
                            <span class="stat-value">${character.learnedSkills.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">可装备槽位:</span>
                            <span class="stat-value">${character.getUnlockedSkillSlotCount()}</span>
                        </div>
                    </div>
                </div>
                
                <button class="success-close-btn">确定</button>
            </div>
        `;
        
        document.body.appendChild(effectModal);
        
        // 绑定关闭事件
        const closeBtn = effectModal.querySelector('.success-close-btn');
        closeBtn.addEventListener('click', () => {
            this.closeSkillBookSuccessEffect(effectModal);
        });
        
        // 点击背景关闭
        effectModal.addEventListener('click', (e) => {
            if (e.target === effectModal) {
                this.closeSkillBookSuccessEffect(effectModal);
            }
        });
        
        // 触发动画
        setTimeout(() => {
            effectModal.classList.add('show');
        }, 10);
        
        // 3秒后自动关闭
        setTimeout(() => {
            if (document.body.contains(effectModal)) {
                this.closeSkillBookSuccessEffect(effectModal);
            }
        }, 3000);
        
        console.log(`显示技能书使用成功效果: ${character.getDisplayName()} 学会了 ${SkillPresets.getPreset(skillBook.skillId)?.name}`);
    }
    
    // 关闭技能书成功效果
    closeSkillBookSuccessEffect(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    // 刷新角色详情面板中的技能槽显示
    refreshCharacterDetailSkillSlots(modal, character) {
        const skillsGrid = modal.querySelector('.character-detail-skills .skills-grid');
        if (!skillsGrid) {
            console.warn('未找到角色详情面板中的技能网格');
            return;
        }
        
        console.log(`刷新角色 ${character.getDisplayName()} 的技能槽显示`);
        
        // 重新生成技能槽HTML
        const skillSlotsHTML = character.skills.map((skill, index) => {
            const isLocked = character.skillSlotLocks[index];
            const slotClass = isLocked ? 'locked' : (skill ? 'filled equipped' : '');
            return `
                <div class="skill-slot ${slotClass}" data-skill-index="${index}">
                    ${skill ? `
                        <div class="skill-slot-header">
                            <div class="skill-slot-icon">${skill.icon}</div>
                            <div class="skill-slot-info">
                                <div class="skill-slot-name">${skill.name}</div>
                                <div class="skill-slot-type">${skill.getTypeText()}</div>
                            </div>
                        </div>
                        <div class="skill-slot-description">${skill.description}</div>
                    ` : `
                        <div class="skill-placeholder">
                            <div class="skill-icon">${isLocked ? '🔒' : '➕'}</div>
                            <div class="skill-text">${isLocked ? '锁定' : '空槽位'}</div>
                        </div>
                    `}
                </div>
            `;
        }).join('');
        
        // 更新技能槽HTML
        skillsGrid.innerHTML = skillSlotsHTML;
        
        // 重新绑定技能槽点击事件
        modal.querySelectorAll('.character-detail-skills .skill-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const skillIndex = parseInt(e.currentTarget.dataset.skillIndex);
                console.log(`点击了角色详情面板中的技能槽位${skillIndex + 1}`);
                
                // 检查是否是被动技能槽（槽位0），被动技能槽无法点击
                if (skillIndex === 0) {
                    console.log(`技能槽 ${skillIndex + 1} 是被动技能槽，无法点击操作`);
                    return;
                }
                
                // 检查技能槽是否被锁定
                if (character.skillSlotLocks[skillIndex]) {
                    console.log(`技能槽位 ${skillIndex + 1} 被锁定，无法操作`);
                    return;
                }
                
                try {
                    this.showSkillSelectionPanel(character, skillIndex);
                } catch (error) {
                    console.error('打开技能选择面板时出错:', error);
                }
            });
        });
        
        // 添加视觉反馈动画
        const skillSlots = modal.querySelectorAll('.character-detail-skills .skill-slot');
        skillSlots.forEach((slot, index) => {
            const skill = character.skills[index];
            if (skill) {
                // 为装备的技能添加闪烁效果
                slot.style.animation = 'none';
                setTimeout(() => {
                    slot.style.animation = 'skillSlotUpdate 0.6s ease-in-out';
                }, 10);
            }
        });
        
        console.log(`角色详情面板技能槽已刷新，找到技能槽数量: ${skillSlots.length}`);
        console.log(`已装备技能数量: ${character.skills.filter(s => s !== null).length}`);
    }
    
    // 刷新当前面板
    refreshCurrentPanel() {
        console.log('刷新当前面板，当前关卡:', this.currentLevel ? this.currentLevel.id : '无');
        console.log('当前角色:', this.currentCharacter ? this.currentCharacter.name : '无');
        
        // 根据当前显示的面板类型刷新对应的面板
        if (this.currentLevel && (this.currentLevel.id === 7 || this.currentLevel.id === 8)) {
            // 草原关卡和森林关卡 - 刷新战斗面板
            console.log('刷新战斗面板');
            this.initBattlePanel();
        } else if (this.currentCharacter) {
            // 其他关卡 - 刷新角色面板
            console.log('刷新角色面板');
            this.initCharacterPanel();
        } else {
            // 如果没有当前角色，尝试刷新默认面板
            console.log('没有当前角色，刷新默认面板');
            const controlContent = document.querySelector('.control-content');
            if (controlContent) {
                this.createEmptyUI(controlContent);
            }
        }
    }
    
    // 关闭技能选择面板
    closeSkillSelectionPanel(modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
        
        // 清理状态
        this.currentSkillSelectionCharacter = null;
        this.currentSkillSelectionSlot = null;
        this.skillBookPage = 0;
    }
    
    // 显示装备详情
    showEquipmentDetail(equipmentIndex) {
        const equipment = this.inventory.filter(item => item.type === '装备');
        const item = equipment[equipmentIndex];
        
        if (!item) {
            console.log('装备不存在');
            return;
        }
        
        // 检查是否已有弹窗，如果有则先移除
        const existingModal = document.querySelector('.equipment-detail-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 创建装备详情弹窗
        const modal = document.createElement('div');
        modal.className = 'equipment-detail-modal';
        modal.innerHTML = `
            <div class="equipment-detail-overlay"></div>
            <div class="equipment-detail-content">
                <div class="equipment-detail-header">
                    <div class="equipment-icon-large">${item.icon}</div>
                    <div class="equipment-title-info">
                        <div class="equipment-name-large" style="color: ${item.getRarityColor()}">${item.name}</div>
                        <div class="equipment-type-large">${item.equipmentType} • ${item.rarity}</div>
                        <div class="equipment-description-large">${item.description}</div>
                    </div>
                    <button class="equipment-close-btn">×</button>
                </div>
                
                <div class="equipment-detail-body">
                    <div class="equipment-main-section">
                        <h4>主词条</h4>
                        <div class="main-affix-display">${item.mainAffix}</div>
                    </div>
                    
                    <div class="equipment-sub-section">
                        <h4>副词条 (${item.subAffixes.length}个)</h4>
                        <div class="sub-affixes-list">
                            ${item.subAffixes.map(affix => `
                                <div class="sub-affix-item" style="border-left: 3px solid ${this.getAffixRarityColor(affix.rarity)}">
                                    <div class="affix-name">副词条-${affix.name}：${this.getAttributeDisplayName(affix.attribute)}+${affix.value} ${this.getAffixValueRange(affix.name, affix.rarity)}</div>
                                    <div class="affix-rarity" style="color: ${this.getAffixRarityColor(affix.rarity)}">${affix.rarity}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="equipment-stats-section">
                        <h4>属性加成总览</h4>
                        <div class="stats-summary">
                            ${this.createEquipmentStatsSummary(item)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件（使用事件监听器而不是内联onclick）
        const closeBtn = modal.querySelector('.equipment-close-btn');
        const overlay = modal.querySelector('.equipment-detail-overlay');
        
        const closeModal = () => {
            modal.classList.add('fade-out');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    // 获取词条稀有度颜色
    getAffixRarityColor(rarity) {
        const colors = {
            '普通': '#6c757d',
            '稀有': '#007bff',
            '神话': '#6f42c1',
            '传说': '#fd7e14'
        };
        return colors[rarity] || '#6c757d';
    }
    
    // 获取属性显示名称
    getAttributeDisplayName(attribute) {
        const names = {
            'attackPower': '攻击力',
            'defense': '防御力',
            'maxHealth': '最大生命值',
            'moveSpeed': '移动速度',
            'healthRegen': '生命恢复速度',
            'manaRegen': '魔法恢复速度',
            'expGain': '经验值获取量',
            'strength': '力量',
            'agility': '敏捷',
            'intelligence': '智慧',
            'skill': '技巧'
        };
        return names[attribute] || attribute;
    }
    
    // 获取词条数值范围显示
    getAffixValueRange(affixName, rarity) {
        const preset = AffixPresets.getPresetByNameAndRarity(affixName, rarity);
        if (preset && preset.minValue !== undefined && preset.maxValue !== undefined) {
            return `<span class="affix-range">(${preset.minValue}~${preset.maxValue})</span>`;
        }
        return '';
    }
    
    // 创建装备属性加成总览
    createEquipmentStatsSummary(item) {
        const bonuses = item.getEquipmentBonuses();
        
        if (Object.keys(bonuses).length === 0) {
            return '<div class="no-stats">无属性加成</div>';
        }
        
        return Object.entries(bonuses).map(([attribute, value]) => `
            <div class="stat-summary-item">
                <span class="stat-name">${this.getAttributeDisplayName(attribute)}</span>
                <span class="stat-value">+${value}</span>
            </div>
        `).join('');
    }
    
    // 在关卡区域左下角显示掉落物通知
    showLevelDropNotification(item) {
        const notification = {
            item: item,
            x: 50, // 左下角位置
            y: this.canvas.height - 100,
            startTime: Date.now(),
            duration: 2000, // 2秒持续时间
            alpha: 1.0
        };
        
        this.levelDropNotifications.push(notification);
    }
    
    // 更新关卡掉落物通知
    updateLevelDropNotifications() {
        const currentTime = Date.now();
        
        // 从后往前遍历，避免删除元素时索引问题
        for (let i = this.levelDropNotifications.length - 1; i >= 0; i--) {
            const notification = this.levelDropNotifications[i];
            const elapsed = currentTime - notification.startTime;
            
            if (elapsed >= notification.duration) {
                // 移除过期的通知
                this.levelDropNotifications.splice(i, 1);
            } else {
                // 更新透明度（淡出效果）
                const progress = elapsed / notification.duration;
                notification.alpha = 1.0 - progress;
                
                // 向上漂浮效果
                notification.y -= 0.5;
            }
        }
    }
    
    // 绘制关卡掉落物通知
    drawLevelDropNotifications() {
        this.levelDropNotifications.forEach(notification => {
            this.ctx.save();
            this.ctx.globalAlpha = notification.alpha;
            
            // 绘制背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(notification.x - 5, notification.y - 25, 200, 40);
            
            // 绘制边框
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(notification.x - 5, notification.y - 25, 200, 40);
            
            // 绘制物品图标
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(notification.item.icon, notification.x, notification.y);
            
            // 绘制物品名称
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = notification.item.getRarityColor();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(notification.item.name, notification.x + 25, notification.y - 5);
            this.ctx.fillText(notification.item.name, notification.x + 25, notification.y - 5);
            
            // 绘制"获得"文字
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = '#00FF00';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeText('获得', notification.x, notification.y + 10);
            this.ctx.fillText('获得', notification.x, notification.y + 10);
            
            this.ctx.restore();
        });
    }
    
    // 绑定金币系统事件
    bindGoldEvents() {
        // 鼠标点击事件
        this.canvas.addEventListener('click', () => {
            this.gold += 1;
            this.updateGoldDisplay();
            console.log(`鼠标点击获得1金币，当前金币: ${this.gold}`);
        });
        
        // 键盘按键弹起事件
        document.addEventListener('keyup', () => {
            this.gold += 1;
            this.updateGoldDisplay();
            console.log(`按键弹起获得1金币，当前金币: ${this.gold}`);
        });
    }
    
    // 更新金币系统
    updateGoldSystem() {
        const currentTime = Date.now();
        
        // 每秒增加1金币
        if (currentTime - this.lastGoldTime >= 1000) {
            this.gold += 1;
            this.updateGoldDisplay();
            this.lastGoldTime = currentTime;
            console.log(`每秒自动获得1金币，当前金币: ${this.gold}`);
        }
    }
    
    // 获得每种技能书各1本（开发者功能）
    getAllSkillBooks() {
        const skillBookIds = [
            'savage_charge_book', 'heavy_punch_book', 'emergency_bandage_book', 'enrage_book',
            'flying_daggers_book', 'fireball_book', 'lightning_strike_book', 'spike_trap_book',
            'whirlwind_axe_book', 'soothing_heal_book', 'rush_book', 'magic_barrier_book',
            'stomp_book', 'weakness_curse_book'
        ];
        
        const addedBooks = [];
        
        skillBookIds.forEach(bookId => {
            try {
                const bookData = ItemPresets.getPreset(bookId);
                if (bookData) {
                    const skillBook = new Item(bookData);
                    this.inventory.push(skillBook);
                    addedBooks.push(skillBook.name);
                    
                    // 添加到本关掉落物追踪
                    this.levelDrops.push({
                        item: skillBook,
                        timestamp: Date.now(),
                        source: '开发者功能'
                    });
                    
                    // 在关卡区域左下角显示掉落物通知
                    this.showLevelDropNotification(skillBook);
                }
            } catch (error) {
                console.error(`获得技能书 ${bookId} 时发生错误:`, error);
            }
        });
        
        console.log(`开发者功能：获得了所有技能书: ${addedBooks.join(', ')}`);
        
        // 显示获得技能书的效果
        this.showSkillBooksAddEffect(addedBooks.length);
        
        // 刷新战斗面板
        this.initBattlePanel();
    }
    
    // 显示获得技能书的视觉效果
    showSkillBooksAddEffect(count) {
        // 创建视觉效果元素
        const effect = document.createElement('div');
        effect.className = 'skill-books-add-effect';
        effect.innerHTML = `
            <div class="effect-icon">📚</div>
            <div class="effect-text">获得 ${count} 本技能书！</div>
        `;
        
        // 添加样式
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: skillBooksAddAnimation 3s ease-out forwards;
        `;
        
        // 添加动画样式
        if (!document.getElementById('skillBooksAddAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'skillBooksAddAnimationStyle';
            style.textContent = `
                @keyframes skillBooksAddAnimation {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    20% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    40% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    80% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                }
                .skill-books-add-effect .effect-icon {
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                .skill-books-add-effect .effect-text {
                    font-size: 16px;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(effect);
        
        // 3秒后移除效果
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 3000);
    }
    
    // 所有角色恢复100魔法值（开发者功能）
    restoreAllMana() {
        const restoredCharacters = [];
        let totalRestored = 0;
        
        // 恢复战斗队伍中的角色魔法值
        this.battleTeam.forEach(character => {
            if (character && !character.isDead) {
                const oldMana = character.currentMana;
                character.currentMana = Math.min(character.currentMana + 100, character.maxMana);
                const actualRestored = character.currentMana - oldMana;
                
                if (actualRestored > 0) {
                    restoredCharacters.push(character.getDisplayName());
                    totalRestored += actualRestored;
                    
                    // 显示魔法恢复效果
                    this.showManaRestoreNumber(character.x, character.y - character.radius - 20, actualRestored);
                }
            }
        });
        
        // 恢复角色仓库中的角色魔法值
        this.characters.forEach(character => {
            if (character && !character.isDead) {
                const oldMana = character.currentMana;
                character.currentMana = Math.min(character.currentMana + 100, character.maxMana);
                const actualRestored = character.currentMana - oldMana;
                
                if (actualRestored > 0 && !restoredCharacters.includes(character.getDisplayName())) {
                    restoredCharacters.push(character.getDisplayName());
                    totalRestored += actualRestored;
                }
            }
        });
        
        console.log(`开发者功能：为 ${restoredCharacters.length} 名角色恢复了总计 ${totalRestored} 点魔法值`);
        console.log(`恢复魔法值的角色: ${restoredCharacters.join(', ')}`);
        
        // 显示魔法恢复的视觉效果
        this.showManaRestoreEffect(restoredCharacters.length, totalRestored);
        
        // 刷新战斗面板
        this.initBattlePanel();
    }
    
    // 显示魔法恢复的视觉效果
    showManaRestoreEffect(characterCount, totalMana) {
        // 创建视觉效果元素
        const effect = document.createElement('div');
        effect.className = 'mana-restore-effect';
        effect.innerHTML = `
            <div class="effect-icon">💙</div>
            <div class="effect-text">为 ${characterCount} 名角色恢复了 ${totalMana} 点魔法值！</div>
        `;
        
        // 添加样式
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,123,255,0.3);
            z-index: 10000;
            animation: manaRestoreAnimation 3s ease-out forwards;
        `;
        
        // 添加动画样式
        if (!document.getElementById('manaRestoreAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'manaRestoreAnimationStyle';
            style.textContent = `
                @keyframes manaRestoreAnimation {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    20% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    40% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    80% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                }
                .mana-restore-effect .effect-icon {
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                .mana-restore-effect .effect-text {
                    font-size: 16px;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(effect);
        
        // 3秒后移除效果
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 3000);
    }
    
    // 计算离线奖励
    calculateOfflineRewards() {
        const currentTime = Date.now();
        const offlineTime = currentTime - this.lastActiveTime;
        
        // 只有离线时间超过5秒才计算奖励（避免频繁切换窗口的干扰）
        if (offlineTime < 5000) {
            this.lastActiveTime = currentTime;
            return;
        }
        
        // 计算离线时长（秒）
        const offlineSeconds = Math.floor(offlineTime / 1000);
        const offlineMinutes = Math.floor(offlineSeconds / 60);
        const offlineHours = Math.floor(offlineMinutes / 60);
        
        // 计算离线金币奖励（每秒1金币，最多24小时）
        const maxOfflineHours = 24;
        const effectiveOfflineSeconds = Math.min(offlineSeconds, maxOfflineHours * 3600);
        const goldReward = effectiveOfflineSeconds;
        
        // 计算离线物品奖励（每小时随机获得1-3个物品）
        const itemRewards = [];
        if (offlineHours > 0) {
            const effectiveOfflineHours = Math.min(offlineHours, maxOfflineHours);
            for (let i = 0; i < effectiveOfflineHours; i++) {
                const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3个物品
                for (let j = 0; j < itemCount; j++) {
                    const randomItems = ['rice', 'milk', 'tomato', 'chicken_leg', 'tea', 'banana'];
                    const randomItem = randomItems[Math.floor(Math.random() * randomItems.length)];
                    itemRewards.push(randomItem);
                }
            }
        }
        
        // 如果有奖励，显示离线奖励面板
        if (goldReward > 0 || itemRewards.length > 0) {
            this.showOfflineRewardsPanel(offlineTime, goldReward, itemRewards);
        }
        
        // 更新最后活跃时间
        this.lastActiveTime = currentTime;
    }
    
    // 显示离线奖励面板
    showOfflineRewardsPanel(offlineTime, goldReward, itemRewards) {
        // 防止重复创建面板
        const existingOverlay = document.querySelector('.offline-rewards-overlay');
        if (existingOverlay) {
            console.log('离线奖励面板已存在，移除旧面板');
            this.removeOfflineRewardsPanel(existingOverlay);
        }
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'offline-rewards-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        // 格式化离线时间
        const formatOfflineTime = (ms) => {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            
            if (hours > 0) {
                return `${hours}小时${minutes % 60}分钟`;
            } else if (minutes > 0) {
                return `${minutes}分钟${seconds % 60}秒`;
            } else {
                return `${seconds}秒`;
            }
        };
        
        // 创建奖励面板
        const panel = document.createElement('div');
        panel.className = 'offline-rewards-panel';
        panel.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            padding: 30px;
            color: white;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            width: 90%;
            animation: slideIn 0.3s ease-out;
        `;
        
        // 创建面板内容
        let itemsHtml = '';
        if (itemRewards.length > 0) {
            const itemCounts = {};
            itemRewards.forEach(itemId => {
                itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
            });
            
            itemsHtml = '<div style="margin-top: 20px;"><h3>🎁 获得物品:</h3><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">';
            Object.entries(itemCounts).forEach(([itemId, count]) => {
                const itemData = ItemPresets.getPreset(itemId);
                if (itemData) {
                    itemsHtml += `<div style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 8px; font-size: 14px;">${itemData.icon} ${itemData.name} x${count}</div>`;
                }
            });
            itemsHtml += '</div></div>';
        }
        
        panel.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 24px;">🌙 离线奖励</h2>
            <p style="font-size: 16px; margin: 10px 0;">离线时间: ${formatOfflineTime(offlineTime)}</p>
            <div style="margin: 20px 0;">
                <h3>💰 获得金币: ${goldReward}</h3>
            </div>
            ${itemsHtml}
            <button id="claimOfflineRewards" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 20px;
                transition: background 0.3s;
            ">领取奖励</button>
        `;
        
        // 添加动画样式
        if (!document.querySelector('#offline-rewards-style')) {
            const style = document.createElement('style');
            style.id = 'offline-rewards-style';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                #claimOfflineRewards:hover {
                    background: #218838 !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        
        // 绑定领取按钮事件 - 简化事件处理，避免冲突
        const claimButton = document.getElementById('claimOfflineRewards');
        
        // 防止重复处理的标志
        let isProcessing = false;
        
        // 统一的处理函数
        const handleClaimRewards = () => {
            if (isProcessing) {
                console.log('正在处理中，忽略重复点击');
                return;
            }
            
            isProcessing = true;
            console.log('开始处理离线奖励领取');
            
            // 立即禁用按钮
            claimButton.disabled = true;
            claimButton.style.background = '#6c757d';
            claimButton.textContent = '领取中...';
            
            try {
                // 发放金币奖励
                this.gold += goldReward;
                this.updateGoldDisplay();
                
                // 发放物品奖励
                itemRewards.forEach(itemId => {
                    const itemData = ItemPresets.getPreset(itemId);
                    if (itemData) {
                        const item = new Item(itemData);
                        this.inventory.push(item);
                    }
                });
                
                console.log(`离线奖励已发放: ${goldReward}金币, ${itemRewards.length}个物品`);
                
                // 显示领取成功提示
                this.showRewardClaimedMessage();
                
                // 立即移除面板
                this.removeOfflineRewardsPanel(overlay);
                
                // 刷新战斗面板
                this.initBattlePanel();
                
            } catch (error) {
                console.error('发放离线奖励时出错:', error);
                // 即使出错也要移除面板
                this.removeOfflineRewardsPanel(overlay);
            } finally {
                isProcessing = false;
            }
        };
        
        // 只绑定必要的事件
        claimButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handleClaimRewards();
        });
        
        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                handleClaimRewards();
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // 点击遮罩层背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                console.log('点击遮罩层背景，领取离线奖励');
                handleClaimRewards();
            }
        });
        
        // 防止面板内点击冒泡到遮罩层
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // 安全超时关闭（防止窗口卡住）
        setTimeout(() => {
            if (overlay && overlay.parentNode && !isProcessing) {
                console.log('离线奖励面板超时自动关闭');
                handleClaimRewards();
            }
        }, 30000);
    }
    
    // 显示奖励领取成功消息
    showRewardClaimedMessage() {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10001;
            animation: fadeInOut 2s ease-in-out;
        `;
        successMsg.textContent = '✅ 离线奖励已领取！';
        
        // 添加淡入淡出动画
        if (!document.querySelector('#success-msg-style')) {
            const msgStyle = document.createElement('style');
            msgStyle.id = 'success-msg-style';
            msgStyle.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; }
                    20%, 80% { opacity: 1; }
                }
            `;
            document.head.appendChild(msgStyle);
        }
        
        document.body.appendChild(successMsg);
        
        // 延迟移除成功提示
        setTimeout(() => {
            try {
                if (successMsg && successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            } catch (error) {
                console.warn('移除成功提示时出错:', error);
            }
        }, 2000);
    }
    
    // 移除离线奖励面板
    removeOfflineRewardsPanel(overlay) {
        try {
            // 多重检查确保安全移除
            if (overlay && overlay.parentNode) {
                // 直接移除overlay
                overlay.parentNode.removeChild(overlay);
                console.log('离线奖励面板已安全移除');
            }
            
            // 额外清理：移除任何残留的离线奖励面板
            const existingOverlays = document.querySelectorAll('.offline-rewards-overlay');
            existingOverlays.forEach(existingOverlay => {
                try {
                    if (existingOverlay && existingOverlay.parentNode) {
                        existingOverlay.parentNode.removeChild(existingOverlay);
                    }
                } catch (cleanupError) {
                    console.warn('清理残留面板时出错:', cleanupError);
                }
            });
            
        } catch (error) {
            console.warn('移除离线奖励面板时出错:', error);
            
            // 强制清理方案
            try {
                const allOverlays = document.querySelectorAll('.offline-rewards-overlay');
                allOverlays.forEach(o => {
                    if (o && o.parentNode) {
                        o.parentNode.removeChild(o);
                    }
                });
                console.log('强制清理完成');
            } catch (forceError) {
                console.error('强制清理也失败:', forceError);
            }
        }
    }
    
    // 手动保存游戏数据
    saveGame() {
        try {
            const saveData = {
                // 基本游戏状态
                gold: this.gold,
                currentLevel: this.currentLevel ? this.currentLevel.id : null,
                killCount: this.killCount,
                crisisValue: this.crisisValue,
                
                // 角色数据
                characters: this.characters.map(char => ({
                    id: char.id,
                    name: char.name,
                    avatar: char.avatar,
                    type: char.type || 'Player',  // ✅ 添加type属性
                    profession: char.profession || '新手',  // ✅ 添加profession属性
                    level: char.level,
                    // ✅ 使用统一的属性名
                    currentExp: char.currentExp || char.experience || 0,
                    maxExp: char.maxExp || char.maxExperience || 100,
                    currentHealth: char.currentHealth || char.health || 100,
                    maxHealth: char.maxHealth || 100,
                    currentMana: char.currentMana || char.mana || 0,
                    maxMana: char.maxMana || 100,
                    attackPower: char.attackPower,
                    defense: char.defense,
                    moveSpeed: char.moveSpeed,
                    x: char.x,
                    y: char.y,
                    isDead: char.isDead,
                    statusEffects: char.statusEffects ? Array.from(char.statusEffects.entries()) : [],
                    // ✅ 保存技能时只保存ID和状态
                    skills: (char.skills || []).map(skill => {
                        if (skill && skill.id) {
                            return {
                                id: skill.id,
                                level: skill.level || 1,
                                experience: skill.experience || 0
                            };
                        }
                        return null;
                    }),
                    equipment: char.equipment || {},
                    title: char.title || null,
                    // 添加缺失的重要属性
                    attributes: char.attributes || {},
                    secondaryAttributes: char.secondaryAttributes || {},
                    // ✅ 保存已学技能时只保存ID和状态
                    learnedSkills: (char.learnedSkills || []).map(skill => {
                        if (skill && skill.id) {
                            return {
                                id: skill.id,
                                level: skill.level || 1,
                                experience: skill.experience || 0
                            };
                        }
                        return null;
                    }).filter(s => s !== null),
                    skillSlot1PassiveOnly: char.skillSlot1PassiveOnly,
                    skillSlot1Locked: char.skillSlot1Locked,
                    skillSlot2ActiveOnly: char.skillSlot2ActiveOnly,
                    skillSlot2Locked: char.skillSlot2Locked,
                    skillSlot3Locked: char.skillSlot3Locked,
                    skillSlot4Locked: char.skillSlot4Locked
                })),
                
                // 当前选中角色
                currentCharacter: this.currentCharacter ? {
                    id: this.currentCharacter.id,
                    name: this.currentCharacter.name
                } : null,
                
                // 背包物品（完整保存物品数据）
                inventory: this.inventory.map(item => {
                    const itemData = {
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        rarity: item.rarity,
                        quantity: item.quantity || 1,
                        description: item.description,
                        effects: item.effects,
                        icon: item.icon,
                        presetId: item.presetId || item.id || null  // 保存presetId用于重建
                    };
                    
                    // 如果是蛋，保存蛋的特殊属性
                    if (item.type === '蛋' && item.attributes) {
                        itemData.attributes = item.attributes;
                    }
                    
                    // 如果是装备，保存装备的特殊属性
                    if (item.type === '装备') {
                        itemData.equipmentType = item.equipmentType;
                        itemData.quality = item.quality;
                        itemData.qualityColor = item.qualityColor;
                        itemData.mainAffix = item.mainAffix;
                        itemData.subAffixes = item.subAffixes;
                    }
                    
                    // 如果是书，保存技能ID
                    if (item.type === '书' && item.skillId) {
                        itemData.skillId = item.skillId;
                    }
                    
                    // 如果是种子，保存种子的特殊属性
                    if (item.type === '种子') {
                        itemData.growthTime = item.growthTime;
                        itemData.harvestMin = item.harvestMin;
                        itemData.harvestMax = item.harvestMax;
                        itemData.cropId = item.cropId;
                        itemData.cropIcon = item.cropIcon;
                    }
                    
                    return itemData;
                }),
                
                // 农场系统数据
                farmPlots: this.farmPlots ? this.farmPlots.map(plot => ({
                    id: plot.id,
                    seedId: plot.seedId || null,
                    seedPreset: plot.seedPreset ? {
                        id: plot.seedPreset.id,
                        name: plot.seedPreset.name,
                        icon: plot.seedPreset.icon,
                        cropIcon: plot.seedPreset.cropIcon,
                        growthTime: plot.seedPreset.growthTime,
                        harvestMin: plot.seedPreset.harvestMin,
                        harvestMax: plot.seedPreset.harvestMax,
                        cropId: plot.seedPreset.cropId
                    } : null,
                    plantTime: plot.plantTime || null,
                    growthDuration: plot.growthDuration || 0,
                    isReady: plot.isReady || false,
                    crop: plot.crop || null
                })) : [],
                
                // 敌人数据
                enemies: this.enemies.map(enemy => ({
                    id: enemy.id,
                    name: enemy.name,
                    level: enemy.level,
                    // ✅ 使用统一的属性名
                    currentHealth: enemy.currentHealth || enemy.health || 100,
                    maxHealth: enemy.maxHealth || 100,
                    attackPower: enemy.attackPower,
                    defense: enemy.defense,
                    moveSpeed: enemy.moveSpeed,
                    x: enemy.x,
                    y: enemy.y,
                    isBoss: enemy.isBoss,
                    avatar: enemy.avatar
                })),
                
                // 任务数据
                availableQuests: this.availableQuests,
                acceptedQuests: this.acceptedQuests,
                completedQuests: this.completedQuests,
                
                // 关卡掉落物
                levelDrops: this.levelDrops,
                
                // 游戏设置
                spawnSwitch: this.spawnSwitch,
                maxEnemies: this.maxEnemies,
                showEnemyCounter: this.showEnemyCounter,
                showHealingNumbers: this.showHealingNumbers,
                showHealthRegenNumbers: this.showHealthRegenNumbers,
                
                // 仓库状态
                warehouseTab: this.warehouseTab,
                warehouseFoodPage: this.warehouseFoodPage,
                warehouseEggPage: this.warehouseEggPage,
                warehouseMaterialPage: this.warehouseMaterialPage,
                warehouseConsumablePage: this.warehouseConsumablePage,
                warehouseEquipmentPage: this.warehouseEquipmentPage,
                warehouseBookPage: this.warehouseBookPage,
                warehouseCharacterPage: this.warehouseCharacterPage,
                
                // 战斗面板状态
                battleTeam: this.battleTeam,
                battleItemTab: this.battleItemTab,
                battleItemPage: this.battleItemPage,
                battleDropsPage: this.battleDropsPage,
                
                // 保存时间戳
                saveTime: Date.now(),
                version: '1.1'  // 更新版本号
            };
            
            // 保存到localStorage
            localStorage.setItem('gameData', JSON.stringify(saveData));
            
            // 显示保存成功提示
            this.showSaveLoadMessage('游戏保存成功！', 'success');
            
            // 更新导航栏按钮状态
            this.updateNavbarButtonStates();
            
            console.log('游戏数据已保存到localStorage（包含农场系统）');
            return true;
            
        } catch (error) {
            console.error('保存游戏数据时发生错误:', error);
            this.showSaveLoadMessage('保存失败：' + error.message, 'error');
            return false;
        }
    }
    
    // 手动读取游戏数据
    loadGame() {
        try {
            const savedData = localStorage.getItem('gameData');
            if (!savedData) {
                this.showSaveLoadMessage('没有找到存档数据', 'warning');
                return false;
            }
            
            const saveData = JSON.parse(savedData);
            
            // 验证存档版本
            if (!saveData.version) {
                this.showSaveLoadMessage('存档版本过旧，无法加载', 'error');
                return false;
            }
            
            // 恢复基本游戏状态
            this.gold = saveData.gold || 0;
            this.killCount = saveData.killCount || 0;
            this.crisisValue = saveData.crisisValue || 0;
            
            // 恢复角色数据
            this.characters = [];
            if (saveData.characters) {
                saveData.characters.forEach(charData => {
                    // 确保角色数据结构完整
                    const characterData = {
                        name: charData.name || '未知角色',
                        title: charData.title || '',
                        avatar: charData.avatar || '👤',
                        type: charData.type || 'Player',
                        level: charData.level || 1,
                        profession: charData.profession || '新手',
                        attributes: charData.attributes || {
                            strength: 1,
                            agility: 1,
                            intelligence: 1,
                            skill: 1
                        },
                        secondaryAttributes: charData.secondaryAttributes || {},
                        maxHealth: charData.maxHealth || 100,
                        currentHealth: charData.currentHealth || charData.health || 100,
                        maxMana: charData.maxMana || 100,
                        currentMana: charData.currentMana || charData.mana || 0,
                        skills: charData.skills || [null, null, null, null],
                        learnedSkills: charData.learnedSkills || [],
                        equipment: charData.equipment || {}
                    };
                    
                    const character = new Character(characterData);
                    
                    // 确保角色有所有必要的方法
                    if (!character.getDisplayName) {
                        character.getDisplayName = function() {
                            return this.title ? `${this.title}${this.name}` : this.name;
                        };
                    }
                    
                    if (!character.getStatusEffect) {
                        character.getStatusEffect = function(statusEffectId) {
                            return this.statusEffects ? this.statusEffects.find(effect => effect.id === statusEffectId) : null;
                        };
                    }
                    
                    if (!character.hasStatusEffect) {
                        character.hasStatusEffect = function(statusEffectId) {
                            return this.statusEffects ? this.statusEffects.some(effect => effect.id === statusEffectId) : false;
                        };
                    }
                    
                    if (!character.updateAttributes) {
                        character.updateAttributes = function() {
                            // 基本的属性更新方法
                            try {
                                if (this.calculateSecondaryAttributes) {
                                    this.secondaryAttributes = this.calculateSecondaryAttributes();
                                }
                                if (this.calculateMaxHealth) {
                                    this.maxHealth = this.calculateMaxHealth();
                                }
                            } catch (error) {
                                console.warn('更新角色属性时出错:', error);
                            }
                        };
                    }
                    
                    // 确保levelUp方法存在
                    if (!character.levelUp || typeof character.levelUp !== 'function') {
                        character.levelUp = function() {
                            // 检查是否已达到等级上限
                            if (this.level >= this.maxLevel) {
                                console.log(`${this.getDisplayName()} 已达到等级上限 ${this.maxLevel}，无法继续升级`);
                                return false;
                            }
                            
                            this.level++;
                            
                            // 每级获得3点属性点，随机分配到4个主属性
                            const attributePoints = 3;
                            const attributes = ['strength', 'agility', 'intelligence', 'skill'];
                            
                            for (let i = 0; i < attributePoints; i++) {
                                const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
                                this.attributes[randomAttr]++;
                            }
                            
                            // 重新计算副属性和生命值
                            if (typeof this.updateAttributes === 'function') {
                                this.updateAttributes();
                            }
                            
                            // 升级时恢复满生命值
                            this.currentHealth = this.maxHealth;
                            
                            // 重新计算最大经验值
                            if (typeof this.calculateMaxExperience === 'function') {
                                this.maxExp = this.calculateMaxExperience();
                            }
                            
                            // 扣除升级所需经验
                            this.currentExp -= this.maxExp;
                            
                            console.log(`${this.getDisplayName()} 升级到 ${this.level} 级！`);
                            
                            return true;
                        };
                    }
                    
                    if (!character.statusEffects) {
                        character.statusEffects = [];
                    }
                    
                    // 恢复角色状态 - 使用正确的属性名
                    character.level = charData.level || character.level;
                    character.currentExp = charData.currentExp || charData.experience || 0;  // 修复：使用currentExp
                    character.maxExp = charData.maxExp || charData.maxExperience || character.maxExp;  // 修复：使用maxExp
                    character.currentHealth = charData.currentHealth || charData.health || character.currentHealth;
                    character.maxHealth = charData.maxHealth || character.maxHealth;
                    character.currentMana = charData.currentMana || charData.mana || character.currentMana;
                    character.maxMana = charData.maxMana || character.maxMana;
                    character.x = charData.x || character.x;
                    character.y = charData.y || character.y;
                    character.isDead = charData.isDead || false;
                    
                    // 恢复装备技能 - 重新创建Skill实例
                    character.skills = [];
                    if (charData.skills) {
                        charData.skills.forEach(skillData => {
                            if (skillData && skillData.id) {
                                // 从技能预制体获取完整数据
                                const skillPreset = SkillPresets.getPreset(skillData.id);
                                if (skillPreset) {
                                    const skill = new Skill(skillPreset);
                                    // 恢复技能的状态（如等级等）
                                    if (skillData.level) skill.level = skillData.level;
                                    if (skillData.experience) skill.experience = skillData.experience;
                                    character.skills.push(skill);
                                } else {
                                    character.skills.push(null);
                                }
                            } else {
                                character.skills.push(null);
                            }
                        });
                    } else {
                        character.skills = [null, null, null, null];
                    }
                    
                    character.equipment = charData.equipment || {};
                    character.title = charData.title || null;
                    
                    // 恢复主属性和次要属性
                    if (charData.attributes) {
                        character.attributes = charData.attributes;
                    }
                    if (charData.secondaryAttributes) {
                        character.secondaryAttributes = charData.secondaryAttributes;
                    }
                    
                    // 恢复技能槽解锁状态
                    character.skillSlot1PassiveOnly = charData.skillSlot1PassiveOnly !== undefined ? charData.skillSlot1PassiveOnly : true;
                    character.skillSlot1Locked = charData.skillSlot1Locked !== undefined ? charData.skillSlot1Locked : true;
                    character.skillSlot2ActiveOnly = charData.skillSlot2ActiveOnly !== undefined ? charData.skillSlot2ActiveOnly : true;
                    character.skillSlot2Locked = charData.skillSlot2Locked !== undefined ? charData.skillSlot2Locked : true;
                    character.skillSlot3Locked = charData.skillSlot3Locked !== undefined ? charData.skillSlot3Locked : true;
                    character.skillSlot4Locked = charData.skillSlot4Locked !== undefined ? charData.skillSlot4Locked : true;
                    
                    // 恢复已学技能 - 重新创建Skill实例
                    character.learnedSkills = [];
                    if (charData.learnedSkills) {
                        charData.learnedSkills.forEach(skillData => {
                            // 从技能预制体获取完整数据
                            const skillPreset = SkillPresets.getPreset(skillData.id);
                            if (skillPreset) {
                                const skill = new Skill(skillPreset);
                                // 恢复技能的状态（如等级等）
                                if (skillData.level) skill.level = skillData.level;
                                if (skillData.experience) skill.experience = skillData.experience;
                                character.learnedSkills.push(skill);
                            }
                        });
                    }
                    
                    // 恢复状态效果
                    character.statusEffects = [];
                    if (charData.statusEffects) {
                        if (Array.isArray(charData.statusEffects)) {
                            character.statusEffects = charData.statusEffects;
                        } else if (charData.statusEffects instanceof Map) {
                            character.statusEffects = Array.from(charData.statusEffects.values());
                        } else {
                            // 如果是其他格式，尝试转换
                            try {
                                character.statusEffects = Array.from(new Map(charData.statusEffects).values());
                            } catch (error) {
                                console.warn('恢复状态效果时出错:', error);
                                character.statusEffects = [];
                            }
                        }
                    }
                    
                    // 加载角色后重新计算属性（重要！）
                    try {
                        if (typeof character.updateAttributes === 'function') {
                            character.updateAttributes();
                        }
                    } catch (error) {
                        console.warn('更新角色属性时出错:', error);
                        // 如果更新失败，至少确保基本属性存在
                        if (!character.secondaryAttributes) {
                            character.secondaryAttributes = character.baseSecondaryAttributes || {};
                        }
                    }
                    
                    this.characters.push(character);
                });
            }
            
            // 恢复当前选中角色
            if (saveData.currentCharacter) {
                this.currentCharacter = this.characters.find(char => 
                    char.id === saveData.currentCharacter.id
                );
            }
            
            // 恢复背包物品
            this.inventory = [];
            if (saveData.inventory) {
                saveData.inventory.forEach(itemData => {
                    let item;
                    if (itemData.type === '蛋') {
                        item = new Egg(itemData);
                        // 恢复蛋的属性，但要确保结构完整
                        if (itemData.attributes) {
                            // 安全地恢复属性，保持结构完整性
                            Object.keys(itemData.attributes).forEach(attrKey => {
                                if (item.attributes[attrKey] && itemData.attributes[attrKey]) {
                                    if (typeof itemData.attributes[attrKey].current !== 'undefined') {
                                        item.attributes[attrKey].current = itemData.attributes[attrKey].current;
                                    }
                                    if (typeof itemData.attributes[attrKey].max !== 'undefined') {
                                        item.attributes[attrKey].max = itemData.attributes[attrKey].max;
                                    }
                                }
                            });
                        }
                        // 确保蛋有完整的方法和属性结构
                        if (!item.attributes) {
                            item.attributes = {
                                satiety: {
                                    current: 0,
                                    max: 100
                                }
                            };
                        }
                        
                        // 确保饱腹度属性存在
                        if (!item.attributes.satiety) {
                            item.attributes.satiety = {
                                current: 0,
                                max: 100
                            };
                        }
                        
                        // 确保饱腹度有current和max属性
                        if (typeof item.attributes.satiety.current === 'undefined') {
                            item.attributes.satiety.current = 0;
                        }
                        if (typeof item.attributes.satiety.max === 'undefined') {
                            item.attributes.satiety.max = 100;
                        }
                        
                        if (!item.canHatch) {
                            item.canHatch = function() {
                                return this.attributes && this.attributes.satiety && 
                                       this.attributes.satiety.current >= this.attributes.satiety.max;
                            };
                        }
                        if (!item.generateMaxValue) {
                            item.generateMaxValue = function() {
                                const ranges = {
                                    '普通': [0, 10],
                                    '稀有': [0, 20],
                                    '神话': [0, 50],
                                    '传说': [0, 100],
                                    '特殊': [0, 15]
                                };
                                const range = ranges[this.rarity] || [0, 10];
                                return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
                            };
                        }
                        if (!item.hatch) {
                            item.hatch = function() {
                                if (!this.canHatch()) {
                                    return null;
                                }
                                
                                // 随机选择角色类型
                                const types = ['random_strength', 'random_agility', 'random_intelligence', 'random_skill'];
                                const randomType = types[Math.floor(Math.random() * types.length)];
                                
                                // 创建基础角色
                                const baseCharacter = new Character(CharacterPresets.getPreset(randomType));
                                
                                // 根据蛋的属性分配8点属性点
                                this.distributeAttributePoints(baseCharacter);
                                
                                return baseCharacter;
                            };
                        }
                        if (!item.distributeAttributePoints) {
                            item.distributeAttributePoints = function(character) {
                                const totalPoints = 8;
                                const attributeNames = ['strength', 'agility', 'intelligence', 'skill'];
                                
                                // 第一步：完全随机分配8点属性点
                                for (let i = 0; i < totalPoints; i++) {
                                    const randomAttr = attributeNames[Math.floor(Math.random() * attributeNames.length)];
                                    character.attributes[randomAttr]++;
                                }
                                
                                console.log('随机分配8点后的属性:', {...character.attributes});
                                
                                // 第二步：根据蛋的当前属性值额外增加对应属性
                                const eggBonuses = {
                                    strength: this.attributes.strength.current,
                                    agility: this.attributes.vitality.current,
                                    intelligence: this.attributes.cleverness.current,
                                    skill: this.attributes.wisdom.current
                                };
                                
                                // 应用蛋属性加成
                                character.attributes.strength += eggBonuses.strength;
                                character.attributes.agility += eggBonuses.agility;
                                character.attributes.intelligence += eggBonuses.intelligence;
                                character.attributes.skill += eggBonuses.skill;
                                
                                console.log('蛋属性加成:', eggBonuses);
                                console.log('最终角色属性:', character.attributes);
                                
                                // 重新计算副属性和生命值
                                character.updateAttributes();
                                
                                // 将当前生命值设置为最大生命值
                                character.currentHealth = character.maxHealth;
                                
                                // 孵化时解锁第一个技能槽（如果还没解锁的话）
                                if (character.skillSlotLocks && character.skillSlotLocks[0]) {
                                    if (typeof character.unlockSkillSlot === 'function') {
                                        character.unlockSkillSlot(0);
                                    }
                                }
                                
                                // 孵化时解锁技能槽1并自动装备被动技能
                                if (character.skillSlot1Locked) {
                                    character.skillSlot1Locked = false;
                                    character.skillSlot1PassiveOnly = true;
                                }
                            };
                        }
                    } else {
                        item = new Item(itemData);
                        // ✅ 确保Item对象有完整的方法
                        // getRarityColor方法应该已经从Item类继承，但为了安全起见，检查并补充
                        if (!item.getRarityColor || typeof item.getRarityColor !== 'function') {
                            item.getRarityColor = function() {
                                const colors = {
                                    '普通': '#FFFFFF',
                                    '稀有': '#4A90E2',
                                    '神话': '#9B59B6',
                                    '传说': '#E67E22',
                                    '特殊': '#27AE60'
                                };
                                return colors[this.rarity] || '#FFFFFF';
                            };
                        }
                        
                        // 确保其他必要的方法也存在
                        if (!item.getAffixBonuses || typeof item.getAffixBonuses !== 'function') {
                            item.getAffixBonuses = function() {
                                const bonuses = {
                                    attackPower: 0,
                                    defense: 0,
                                    moveSpeed: 0,
                                    healthRegen: 0,
                                    manaRegen: 0,
                                    critRate: 0,
                                    critDamage: 0
                                };
                                
                                if (this.mainAffix) {
                                    const match = this.mainAffix.match(/([+\-]?\d+)/);
                                    if (match) {
                                        const value = parseInt(match[1]);
                                        if (this.mainAffix.includes('攻击力')) bonuses.attackPower += value;
                                        else if (this.mainAffix.includes('防御力')) bonuses.defense += value;
                                        else if (this.mainAffix.includes('移动速度')) bonuses.moveSpeed += value;
                                        else if (this.mainAffix.includes('生命恢复')) bonuses.healthRegen += value;
                                        else if (this.mainAffix.includes('法力恢复')) bonuses.manaRegen += value;
                                        else if (this.mainAffix.includes('暴击率')) bonuses.critRate += value;
                                        else if (this.mainAffix.includes('暴击伤害')) bonuses.critDamage += value;
                                    }
                                }
                                
                                if (this.subAffixes && Array.isArray(this.subAffixes)) {
                                    this.subAffixes.forEach(affix => {
                                        const match = affix.match(/([+\-]?\d+)/);
                                        if (match) {
                                            const value = parseInt(match[1]);
                                            if (affix.includes('攻击力')) bonuses.attackPower += value;
                                            else if (affix.includes('防御力')) bonuses.defense += value;
                                            else if (affix.includes('移动速度')) bonuses.moveSpeed += value;
                                            else if (affix.includes('生命恢复')) bonuses.healthRegen += value;
                                            else if (affix.includes('法力恢复')) bonuses.manaRegen += value;
                                            else if (affix.includes('暴击率')) bonuses.critRate += value;
                                            else if (affix.includes('暴击伤害')) bonuses.critDamage += value;
                                        }
                                    });
                                }
                                
                                return bonuses;
                            };
                        }
                    }
                    this.inventory.push(item);
                });
            }
            
            // 恢复农场系统数据
            if (saveData.farmPlots && Array.isArray(saveData.farmPlots)) {
                this.farmPlots = saveData.farmPlots.map(plotData => {
                    const plot = {
                        id: plotData.id,
                        seedId: plotData.seedId || null,
                        seedPreset: null,
                        plantTime: plotData.plantTime || null,
                        growthDuration: plotData.growthDuration || 0,
                        isReady: plotData.isReady || false,
                        crop: plotData.crop || null
                    };
                    
                    // 恢复种子预设数据
                    if (plotData.seedPreset && plotData.seedId) {
                        // 尝试从ItemPresets获取完整的种子预设
                        const fullPreset = ItemPresets.getPreset(plotData.seedId);
                        if (fullPreset) {
                            plot.seedPreset = fullPreset;
                        } else {
                            // 如果无法获取，使用保存的数据
                            plot.seedPreset = plotData.seedPreset;
                        }
                    }
                    
                    return plot;
                });
                console.log(`恢复了 ${this.farmPlots.length} 个种植槽`);
            } else {
                // 如果没有保存的农场数据，初始化空的农场系统
                this.farmPlots = [];
                for (let i = 0; i < 10; i++) {
                    this.farmPlots.push({
                        id: i,
                        seedId: null,
                        seedPreset: null,
                        plantTime: null,
                        growthDuration: 0,
                        isReady: false,
                        crop: null
                    });
                }
                console.log('初始化了新的农场系统（10个种植槽）');
            }
            
            // 恢复背包中种子的presetId
            this.inventory.forEach(item => {
                if (item.type === '种子' && !item.presetId) {
                    // 尝试通过名称查找presetId
                    const seedMap = {
                        '胡萝卜种子': 'carrot_seed',
                        '土豆种子': 'potato_seed',
                        '鱼苗': 'fish_seed',
                        '蘑菇孢子': 'mushroom_seed',
                        '番茄种子': 'tomato_seed',
                        '香蕉种子': 'banana_seed',
                        '茶叶种子': 'tea_seed'
                    };
                    item.presetId = seedMap[item.name] || null;
                }
            });
            
            // 恢复敌人数据
            this.enemies = [];
            if (saveData.enemies) {
                saveData.enemies.forEach(enemyData => {
                    const enemy = new Enemy(enemyData);
                    // 恢复敌人状态
                    enemy.level = enemyData.level;
                    enemy.health = enemyData.health;
                    enemy.maxHealth = enemyData.maxHealth;
                    enemy.attackPower = enemyData.attackPower;
                    enemy.defense = enemyData.defense;
                    enemy.moveSpeed = enemyData.moveSpeed;
                    enemy.x = enemyData.x;
                    enemy.y = enemyData.y;
                    enemy.isBoss = enemyData.isBoss;
                    
                    this.enemies.push(enemy);
                });
            }
            
            // 恢复任务数据 - 重新创建Quest实例
            this.availableQuests = [];
            if (saveData.availableQuests) {
                saveData.availableQuests.forEach(questData => {
                    const quest = new Quest(questData);
                    this.availableQuests.push(quest);
                });
            }
            
            this.acceptedQuests = [];
            if (saveData.acceptedQuests) {
                saveData.acceptedQuests.forEach(questData => {
                    const quest = new Quest(questData);
                    this.acceptedQuests.push(quest);
                });
            }
            
            this.completedQuests = [];
            if (saveData.completedQuests) {
                saveData.completedQuests.forEach(questData => {
                    const quest = new Quest(questData);
                    this.completedQuests.push(quest);
                });
            }
            
            // 恢复关卡掉落物
            this.levelDrops = saveData.levelDrops || [];
            
            // 恢复游戏设置
            this.spawnSwitch = saveData.spawnSwitch || false;
            this.maxEnemies = saveData.maxEnemies || 10;
            this.showEnemyCounter = saveData.showEnemyCounter || false;
            this.showHealingNumbers = saveData.showHealingNumbers !== undefined ? saveData.showHealingNumbers : true;
            this.showHealthRegenNumbers = saveData.showHealthRegenNumbers || false;
            
            // 恢复仓库状态
            this.warehouseTab = saveData.warehouseTab || 'foods';
            this.warehouseFoodPage = saveData.warehouseFoodPage || 0;
            this.warehouseEggPage = saveData.warehouseEggPage || 0;
            this.warehouseMaterialPage = saveData.warehouseMaterialPage || 0;
            this.warehouseConsumablePage = saveData.warehouseConsumablePage || 0;
            this.warehouseEquipmentPage = saveData.warehouseEquipmentPage || 0;
            this.warehouseBookPage = saveData.warehouseBookPage || 0;
            this.warehouseCharacterPage = saveData.warehouseCharacterPage || 0;
            
            // 恢复战斗面板状态
            this.battleTeam = saveData.battleTeam || [null, null, null, null];
            this.battleItemTab = saveData.battleItemTab || 'consumable';
            this.battleItemPage = saveData.battleItemPage || 0;
            this.battleDropsPage = saveData.battleDropsPage || 0;
            
            // 恢复关卡
            if (saveData.currentLevel) {
                this.loadLevel(saveData.currentLevel, { isLoadingFromSave: true });
            }
            
            // 更新UI显示
            this.updateGoldDisplay();
            this.initCharacterPanel();
            
            // 显示加载成功提示
            const saveTime = new Date(saveData.saveTime);
            this.showSaveLoadMessage(`存档加载成功！\n保存时间: ${saveTime.toLocaleString()}`, 'success');
            
            // 更新导航栏按钮状态
            this.updateNavbarButtonStates();
            
            console.log('游戏数据已从localStorage加载（包含农场系统）');
            console.log('存档保存时间:', saveTime.toLocaleString());
            console.log('存档版本:', saveData.version || '1.0');
            return true;
            
        } catch (error) {
            console.error('加载游戏数据时发生错误:', error);
            this.showSaveLoadMessage('加载失败：' + error.message, 'error');
            return false;
        }
    }
    
    // 显示保存/加载消息
    showSaveLoadMessage(message, type = 'info') {
        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `save-load-message ${type}`;
        messageDiv.innerHTML = message.replace(/\n/g, '<br>');
        
        // 设置样式
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            line-height: 1.4;
        `;
        
        // 添加到页面
        document.body.appendChild(messageDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
    
    // 检查是否有存档
    hasSaveData() {
        return localStorage.getItem('gameData') !== null;
    }
    
    // 删除存档
    deleteSave() {
        try {
            localStorage.removeItem('gameData');
            this.showSaveLoadMessage('存档已删除', 'warning');
            this.updateNavbarButtonStates();
            console.log('存档数据已删除');
            return true;
        } catch (error) {
            console.error('删除存档时发生错误:', error);
            this.showSaveLoadMessage('删除存档失败：' + error.message, 'error');
            return false;
        }
    }
    
    // 初始化导航栏存档按钮
    initNavbarSaveLoadButtons() {
        const navSaveBtn = document.getElementById('navSaveBtn');
        const navLoadBtn = document.getElementById('navLoadBtn');
        
        // 检查按钮是否存在且可见
        if (navSaveBtn && navSaveBtn.offsetParent !== null) {
            navSaveBtn.addEventListener('click', () => {
                this.saveGame();
            });
        }
        
        if (navLoadBtn && navLoadBtn.offsetParent !== null) {
            navLoadBtn.addEventListener('click', () => {
                this.loadGame();
            });
        }
        
        // 初始化按钮状态（仅当按钮可见时）
        if (navLoadBtn && navLoadBtn.offsetParent !== null) {
            this.updateNavbarButtonStates();
        }
    }
    
    // 更新导航栏按钮状态
    updateNavbarButtonStates() {
        const navLoadBtn = document.getElementById('navLoadBtn');
        
        // 仅当按钮存在且可见时才更新状态
        if (navLoadBtn && navLoadBtn.offsetParent !== null) {
            // 检查是否有存档数据
            const hasSave = this.hasSaveData();
            navLoadBtn.disabled = !hasSave;
            
            if (hasSave) {
                navLoadBtn.title = '读取存档';
            } else {
                navLoadBtn.title = '没有存档数据';
            }
        }
    }
    
    // 隐藏新开发者按钮
    hideNewDeveloperButton() {
        const newDeveloperButton = document.getElementById('newDeveloperButton');
        if (newDeveloperButton) {
            newDeveloperButton.style.display = 'none';
            console.log('新开发者按钮已隐藏');
        }
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting game...');
    
    try {
        const game = new Game();
        window.game = game;
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});