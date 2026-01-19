import { inject } from '@vercel/analytics';
inject();

import Phaser from 'phaser';
// import * as Tone from 'tone'; // Code Splitting for Performance
let Tone: any; // Dynamic load variable
import Papa from 'papaparse';

// --- 型定義 ---
interface ItemData {
    id: string;
    name_en: string;
    name_ja: string;
    category: 'accessory' | 'effect' | 'consumable';
    effectType: 'speed' | 'rate' | 'size' | 'heal_hp' | 'heal_mp' | 'buff_speed';
    value: number;
    price: number;
    description_en: string;
    description_ja: string;
    rarity?: 'common' | 'rare' | 'legendary';
}

interface GuitarData {
    id: string;
    name_en: string;
    name_ja: string;
    tags: string[];
    speed: number;
    fireRate: number;
    price: number;
    description_en: string;
    description_ja: string;
}

interface SkillData {
    id: string;
    name_en: string;
    name_ja: string;
    reqLevel: number;
    price: number;
    mpCost: number;
    description_en: string;
    description_ja: string;
    learned: boolean;
    type?: 'Active' | 'Passive';
}

// --- 翻訳データ (Localization) ---
const TRANSLATIONS = {
    ja: {
        LANG_BUTTON: "English", // ボタンのラベル（押すと英語になる）
        GAME_START: "GAME START",
        CONTINUE: "CONTINUE",
        PRACTICE: "PRACTICE MODE",
        SHOP: "ショップ",
        STATUS: "ステータス",
        GAME_OVER: "GAME OVER",
        RETURN_TITLE: "タイトルへ戻る",
        HP: "HP",
        MP: "MP",
        STAGE_CLEAR: "STAGE CLEAR!",
        GET_ITEM: "アイテム獲得: ",
        LEVEL_UP: "LEVEL UP!",
        SKILL_LEARNED: "スキル習得: ",
        HELP: "ヘルプ"
    },
    en: {
        LANG_BUTTON: "日本語", // ボタンのラベル（押すと日本語になる）
        GAME_START: "GAME START",
        CONTINUE: "CONTINUE",
        PRACTICE: "PRACTICE MODE",
        SHOP: "SHOP",
        STATUS: "STATUS",
        GAME_OVER: "GAME OVER",
        RETURN_TITLE: "RETURN TO TITLE",
        HP: "HP",
        MP: "MP",
        STAGE_CLEAR: "STAGE CLEAR!",
        GET_ITEM: "Got Item: ",
        LEVEL_UP: "LEVEL UP!",
        SKILL_LEARNED: "Learned: ",
        HELP: "HELP"
    }
};

// 翻訳ヘルパー関数
function getTx(key: string): string {
    const lang = GameDataManager.instance.language;
    return (TRANSLATIONS[lang] as any)[key] || key;
}

function getTxItemName(item: ItemData | GuitarData | SkillData | any): string {
    const lang = GameDataManager.instance.language;
    if (!item) return "";
    return (lang === 'ja' ? item.name_ja : item.name_en) || item.name_en || "???";
}

function getTxItemDesc(item: ItemData | GuitarData | SkillData | any): string {
    const lang = GameDataManager.instance.language;
    if (!item) return "";
    return (lang === 'ja' ? item.description_ja : item.description_en) || item.description_en || "";
}

// --- Manual Data ---
const MANUAL_JA = `
<h3>1. ゲーム概要 (Game Overview)</h3>
<p>本アプリケーションは、プレイヤーがギタリストとなり、迫りくる「メトロノーム軍団」をギターサウンド（弾丸）で撃退しながら成長していく2D見下ろし型シューティングRPGです。<br>
プレイヤーは稼いだ資金で新たなギターを購入し、スキルを習得し、アイテムで身体能力を強化して、最強のギタリストを目指します。</p>

<h3>2. 操作方法 (Controls)</h3>
<p>PCブラウザ環境での操作を前提としています。</p>
<ul>
    <li><b>移動:</b> W, A, S, D または 矢印キー</li>
    <li><b>攻撃:</b> 自動 (Auto Fire) - 最も近い敵を狙います。</li>
    <li><b>スキル:</b> SPACE キー (Active Skill)</li>
    <li><b>UI操作:</b> マウス (クリック)</li>
    <li><b>言語切替:</b> 画面右上ボタン (タイトル画面)</li>
</ul>

<h3>3. 画面表示 (HUD)</h3>
<p><b>プレイ画面:</b><br>
HP (赤): 0になるとGAME OVER。<br>
MP (青): スキル使用で消費。<br>
Gold: お金。ショップで使用。</p>

<p><b>ショップ (Map上のSHOP):</b><br>
GUITAR: 武器購入。Rate(連射)などが変化。<br>
ITEM: 回復・強化アイテム。<br>
SKILL: パッシブ・アクティブスキルの習得。</p>

<h3>4. ゲームシステム (Mechanics)</h3>
<p><b>戦闘:</b> 敵(メトロノーム)はプレイヤーに向かってきます。接触するとダメージ(10)。倒すとGoldを落とします。</p>
<p><b>ステータス:</b><br>
Speed: 移動速度<br>
Rate: 連射間隔 (値が小さいほど速い)<br>
Size: 弾の大きさ<br>
MP Cost: スキル消費MP</p>

<h3>5. データベース (Database)</h3>
<p><b>ギター (Weapons):</b><br>
G000 Old Acoustic: 初期装備。<br>
G005 Yamaha Pacifica: バランス型。<br>
G015 Ibanez JEM: 速弾き特化 (Rate:380)。<br>
G019 Gibson L5 CES: ジャズの皇帝。高威力。<br>
I023 Pick of Destiny: 連射速度が劇的に向上 (Rate x0.1)。</p>

<p><b>アイテム (Items):</b><br>
Energy Drink: HP回復。<br>
Black Coffee: MP回復。<br>
Pick (各種): 所持でステータス補正。</p>

<p><b>スキル (Skills):</b><br>
S001 Down Picking: Speed微増。<br>
S007 Power Chord: 弾サイズUp。<br>
S009 Sweep Picking: 範囲攻撃 (Active)。</p>

<h3>6. トラブルシューティング</h3>
<p>HPが0になるとGAME OVERとなり、3秒後にマップへ戻ります。Goldは維持されます。</p>
`;

const MANUAL_EN = `
<h3>1. Game Overview</h3>
<p>This is a top-down 2D shooting RPG where you play as a guitarist repelling the "Metronome Army" with guitar sounds. Buy guitars, learn skills, and become the Legend.</p>

<h3>2. Controls</h3>
<p>Designed for PC Browsers.</p>
<ul>
    <li><b>Move:</b> W, A, S, D or Arrow Keys</li>
    <li><b>Attack:</b> Auto Fire (aims at nearest enemy)</li>
    <li><b>Skill:</b> SPACE Key (Active Skill)</li>
    <li><b>UI:</b> Mouse Click</li>
    <li><b>Language:</b> Top-Right Button (Title Screen)</li>
</ul>

<h3>3. HUD</h3>
<p><b>Game Scene:</b><br>
HP (Red): Game Over if 0.<br>
MP (Blue): Consumed by skills.<br>
Gold: Currency.</p>

<p><b>Shop:</b><br>
GUITAR: Buy weapons (affects Rate/Speed).<br>
ITEM: Recovery & Buffs.<br>
SKILL: Learn Passive/Active skills.</p>

<h3>4. Mechanics</h3>
<p><b>Combat:</b> Enemies chase you. Contact deals 10 damage. Defeat to get Gold.</p>
<p><b>Stats:</b><br>
Speed: Movement Speed<br>
Rate: Fire Interval (Lower is faster)<br>
Size: Bullet Size<br>
MP Cost: Mana consumption</p>

<h3>5. Database</h3>
<p><b>Guitars:</b><br>
G000 Old Acoustic: Starter.<br>
G005 Yamaha Pacifica: Balanced.<br>
G015 Ibanez JEM: Shred specialist (Rate:380).<br>
G019 Gibson L5 CES: Jazz Emperor.<br>
I023 Pick of Destiny: Extreme Fire Rate (Rate x0.1).</p>

<p><b>Items:</b><br>
Energy Drink: Heal HP.<br>
Black Coffee: Heal MP.<br>
Picks: Passive stats boost.</p>

<p><b>Skills:</b><br>
S001 Down Picking: Speed up.<br>
S007 Power Chord: Bullet Size up.<br>
S009 Sweep Picking: Area Attack (Active).</p>

<h3>6. Troubleshooting</h3>
<p>If HP hits 0, it's GAME OVER. You return to Map after 3s. Gold is kept.</p>
`;

function openHelpModal() {
    const lang = GameDataManager.instance.language;
    const content = lang === 'ja' ? MANUAL_JA : MANUAL_EN;
    const title = lang === 'ja' ? "MANUAL" : "MANUAL";

    const overlay = document.createElement('div');
    overlay.className = 'cyber-overlay';

    const panel = document.createElement('div');
    panel.className = 'cyber-panel';
    panel.style.width = '600px';
    panel.style.maxWidth = '90%';

    panel.innerHTML = `
        <h2 class="cyber-title">${title}</h2>
        <div style="text-align:left; line-height:1.6; max-height:60vh; overflow-y:auto; padding-right:10px;">
            ${content}
        </div>
        <div style="text-align:center; margin-top:20px;">
            <button class="cyber-btn" id="help-close-btn">CLOSE</button>
        </div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    document.getElementById('help-close-btn')!.onclick = () => {
        overlay.remove();
    };
}

// ★データ管理 (変数定義漏れ修正済み)
// ==========================================
class GameDataManager {
    static instance: GameDataManager;

    // ★必須変数
    currentStage: number = 1;
    stageNames: string[] = [
        "Street Live", "School Festival", "Wedding Party", "Local Bar",
        "Jazz Club", "Live House", "Zepp Tokyo", "Summer Fes", "Arena Tour", "BUDOKAN"
    ];
    stageNamesJa: string[] = [
        "路上ライブ", "文化祭", "結婚式二次会", "地元のバー",
        "ジャズクラブ", "ライブハウス", "Zepp Tokyo", "夏フェス", "アリーナツアー", "日本武道館"
    ];

    getStageName(stageIndex: number): string {
        if (stageIndex < 0) return "Unknown";
        if (this.language === 'ja') return this.stageNamesJa[stageIndex] || "Unknown";
        return this.stageNames[stageIndex] || "Unknown";
    }

    isPracticeMode: boolean = false;
    money: number = 2000;
    playerLevel: number = 1;
    playerExp: number = 0;
    nextLevelExp: number = 10;

    maxHp: number = 100;
    currentHp: number = 100;
    maxMp: number = 50;
    currentMp: number = 50;

    inventory: ItemData[] = [];
    equippedItems: ItemData[] = [];
    maxEquipSlots: number = 3;

    equippedSkills: SkillData[] = [];
    maxSkillSlots: number = 3;

    currentGuitar: GuitarData | null = null;
    shopStock: (ItemData | GuitarData)[] = [];

    itemMaster: ItemData[] = [];
    guitarMaster: GuitarData[] = [];
    skillMaster: SkillData[] = [];

    // ★言語設定を追加 ('ja' または 'en')
    language: 'ja' | 'en' = 'ja';

    constructor() {
        GameDataManager.instance = this;
    }

    // --- Save / Load System ---
    save() {
        const data = {
            money: this.money,
            playerLevel: this.playerLevel,
            playerExp: this.playerExp,
            nextLevelExp: this.nextLevelExp,
            currentStage: this.currentStage,
            maxHp: this.maxHp,
            maxMp: this.maxMp,
            inventory: this.inventory,
            equippedItems: this.equippedItems,
            equippedSkills: this.equippedSkills,
            shopStock: this.shopStock,
            currentGuitar: this.currentGuitar,
            skillMaster: this.skillMaster
        };
        localStorage.setItem('guitar_survivor_save', JSON.stringify(data));
    }

    load(): boolean {
        const json = localStorage.getItem('guitar_survivor_save');
        if (json) {
            const data = JSON.parse(json);
            this.money = data.money || 2000;
            this.playerLevel = data.playerLevel || 1;
            this.playerExp = data.playerExp || 0;
            this.nextLevelExp = data.nextLevelExp || 10;
            this.currentStage = data.currentStage || 1;
            this.maxHp = data.maxHp || 100;
            this.maxMp = data.maxMp || 50;
            this.currentHp = data.maxHp;
            this.currentMp = data.maxMp;

            // ★Hydrate from Master Data (Fix for Missing Translations in Old Save)
            const hydrateInfos = (list: any[]) => {
                return list.map(oldItem => {
                    const freshItem = this.itemMaster.find(i => i.id === oldItem.id);
                    if (freshItem) return { ...freshItem };
                    const freshGuitar = this.guitarMaster.find(g => g.id === oldItem.id);
                    if (freshGuitar) return { ...freshGuitar };
                    return oldItem;
                });
            };

            this.inventory = hydrateInfos(data.inventory || []);
            this.equippedItems = hydrateInfos(data.equippedItems || []);
            this.shopStock = hydrateInfos(data.shopStock || []);

            if (data.currentGuitar) {
                const freshG = this.guitarMaster.find(g => g.id === data.currentGuitar.id);
                this.currentGuitar = freshG ? { ...freshG } : data.currentGuitar;
            } else {
                this.currentGuitar = null;
            }

            // Skills are special (we just need learned status)
            // But we also want to display names, so let's rely on Master for everything except 'learned'
            // Actually, skillMaster is already populated from CSV in BootScene.
            // We just need to apply 'learned' from save.
            this.equippedSkills = []; // Will be rebuild from IDs if needed, or just hydrate
            // Wait, equippedSkills is list of SkillData.
            // Better to re-find them from master.
            // Skills: Re-link to master using IDs to ensure we have the correct object references (with 'learned' status, etc.)
            const savedEquipped = data.equippedSkills || [];
            this.equippedSkills = [];
            savedEquipped.forEach((s: any) => {
                const master = this.skillMaster.find(sm => sm.id === s.id);
                if (master) {
                    // Update master learned status if needed (though master should be source of truth for properties, learned comes from save if we save it there)
                    master.learned = true; // If it was equipped, it must be learned
                    this.equippedSkills.push(master);
                }
            });

            // Restore learned status from save for all skills
            if (data.skillMaster && this.skillMaster.length > 0) {
                this.skillMaster.forEach(s => {
                    const saved = data.skillMaster.find((ss: SkillData) => ss.id === s.id);
                    if (saved && saved.learned) s.learned = true;
                });
            }
            return true;
        }
        return false;
    }

    resetData() {
        localStorage.removeItem('guitar_survivor_save');
        location.reload();
    }

    // --- Game Logic ---
    addItem(item: ItemData) { this.inventory.push(item); this.save(); }

    equipItem(inventoryIndex: number) {
        const item = this.inventory[inventoryIndex];
        if (!item || item.category === 'consumable') return;
        if (this.equippedItems.length >= this.maxEquipSlots) return;
        this.inventory.splice(inventoryIndex, 1);
        this.equippedItems.push(item);
        this.save();
    }

    unequipItem(equipIndex: number) {
        const item = this.equippedItems[equipIndex];
        this.equippedItems.splice(equipIndex, 1);
        this.inventory.push(item);
        this.save();
    }

    equipSkill(skillId: string): boolean {
        if (this.equippedSkills.length >= this.maxSkillSlots) return false;
        const skill = this.skillMaster.find(s => s.id === skillId);
        if (skill && skill.learned && !this.equippedSkills.includes(skill)) {
            this.equippedSkills.push(skill);
            this.save();
            return true;
        }
        return false;
    }

    unequipSkill(index: number) {
        this.equippedSkills.splice(index, 1);
        this.save();
    }

    sellItemById(itemId: string): boolean {
        const index = this.inventory.findIndex(i => i.id === itemId);
        if (index > -1) {
            const item = this.inventory[index];
            this.inventory.splice(index, 1);
            this.money += Math.floor(item.price / 2);
            this.shopStock.push(item);
            this.save();
            return true;
        }
        return false;
    }

    buyItem(item: ItemData | GuitarData) {
        if ('tags' in item) {
            if (this.currentGuitar) this.shopStock.push(this.currentGuitar);
            this.currentGuitar = item as GuitarData;
        } else {
            this.inventory.push(item as ItemData);
        }
        const stockIndex = this.shopStock.indexOf(item);
        if (stockIndex > -1) this.shopStock.splice(stockIndex, 1);
        this.money -= item.price;
        this.save();
    }

    // 修正: 戻り値をオブジェクト型に統一
    consumeItem(item: ItemData): { success: boolean, type: string } {
        let used = false;
        if (item.effectType === 'heal_hp') {
            if (this.currentHp < this.maxHp) {
                this.currentHp = Math.min(this.currentHp + item.value, this.maxHp);
                used = true;
            }
        } else if (item.effectType === 'heal_mp') {
            if (this.currentMp < this.maxMp) {
                this.currentMp = Math.min(this.currentMp + item.value, this.maxMp);
                used = true;
            }
        } else if (item.effectType === 'buff_speed') {
            used = true;
        }
        if (used) {
            const idx = this.inventory.indexOf(item);
            if (idx > -1) this.inventory.splice(idx, 1);
            this.save();
            return { success: true, type: item.effectType };
        }
        return { success: false, type: '' };
    }

    gainExp(amount: number): boolean {
        this.playerExp += amount;
        if (this.playerExp >= this.nextLevelExp) {
            this.playerLevel++;
            this.playerExp = 0;
            this.nextLevelExp = Math.ceil(this.nextLevelExp * 1.5);
            this.maxHp += 10; this.maxMp += 5;
            this.currentHp = this.maxHp; this.currentMp = this.maxMp;
            this.save();
            return true;
        }
        return false;
    }

    calculateStats() {
        let speed = this.currentGuitar ? this.currentGuitar.speed : 100;
        let fireRate = this.currentGuitar ? this.currentGuitar.fireRate : 800;
        let bulletSize = 20;

        this.equippedItems.forEach(item => {
            if (item.effectType === 'speed') speed += item.value;
            if (item.effectType === 'rate') fireRate *= item.value;
            if (item.effectType === 'size') bulletSize += item.value;
        });

        this.equippedSkills.forEach(s => {
            if (s.type === 'Passive') {
                if (s.id === 'S001') speed *= 1.1;
                if (s.id === 'S002') fireRate *= 0.9;
                if (s.id === 'S003') fireRate *= 0.9;
                if (s.id === 'S004') fireRate *= 0.9;
                if (s.id === 'S010') fireRate *= 0.8;
                if (s.id === 'S011') speed *= 1.2;
                if (s.id === 'S016') speed *= 1.5;
                if (s.id === 'S017') bulletSize *= 2.0;
                if (s.id === 'S020') { speed *= 1.2; fireRate *= 0.8; bulletSize *= 1.2; }
            }
        });

        return { speed, fireRate, bulletSize };
    }
}
const DataManager = new GameDataManager();


// ==========================================
// シーン0: ブート
// ==========================================
class BootScene extends Phaser.Scene {
    constructor() { super('boot-scene'); }

    preload() {
        // ★ローディング表示を削除 (一瞬変な画面が出ないように黒画面のまま待機)
        // this.add.text(cx, cy, 'LOADING...', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

        Papa.parse('/items.csv', {
            download: true, header: true, dynamicTyping: true, complete: (r) => {
                DataManager.itemMaster = r.data as ItemData[];
                // Only init shop if new game (shopStock is empty or we haven't loaded yet)
                // We will handle data loading after all CSVs are done.
                this.check();
            }
        });
        Papa.parse('/guitars.csv', {
            download: true, header: true, dynamicTyping: true, complete: (r) => {
                DataManager.guitarMaster = (r.data as any[]).map(row => ({ ...row, tags: row.tags ? row.tags.split('|') : [], fireRate: row.rate })).filter(g => g.id);
                if (!DataManager.currentGuitar && DataManager.guitarMaster.length > 0) DataManager.currentGuitar = { ...DataManager.guitarMaster[0] };
                this.check();
            }
        });
        Papa.parse('/skills.csv', {
            download: true, header: true, dynamicTyping: true, complete: (r) => {
                DataManager.skillMaster = (r.data as any[]).map(row => {
                    const desc = row.description_en || "";
                    const type = (desc && desc.includes('Active')) ? 'Active' : 'Passive';
                    return { ...row, learned: false, type: type };
                }).filter(s => s.id);
                this.check();
            }
        });
        this.createPixelArtTextures();
    }

    check() {
        if (DataManager.itemMaster.length && DataManager.guitarMaster.length && DataManager.skillMaster.length) {
            // Remove loading screen when data is ready
            const loading = document.getElementById('loading-screen');
            if (loading) loading.remove();

            // Try to load save data NOW, after masters are ready
            // If load returns false (no save), we populate default shop.
            if (!DataManager.load()) {
                // New Game Setup
                DataManager.shopStock = [...DataManager.itemMaster].filter(i => i.name_en && i.rarity === 'common');
                DataManager.shopStock.push(...DataManager.guitarMaster);
            }

            this.createTitleScreen();
        }
    }

    createTitleScreen() {
        // 画面をクリアしてタイトル表示
        this.children.removeAll();
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Language Button (Top Right)
        const langBtn = this.add.text(this.scale.width - 20, 20, getTx('LANG_BUTTON'), {
            fontFamily: 'Orbitron', fontSize: '20px', color: '#fff'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        langBtn.on('pointerdown', () => {
            const current = DataManager.language;
            DataManager.language = current === 'ja' ? 'en' : 'ja';
            // Reload title screen
            this.createTitleScreen();
        });
        langBtn.on('pointerover', () => langBtn.setColor('#00f3ff'));
        langBtn.on('pointerout', () => langBtn.setColor('#fff'));

        // Help Button
        const helpBtn = this.add.text(this.scale.width - 120, 20, getTx('HELP'), {
            fontFamily: 'Orbitron', fontSize: '20px', color: '#fff'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        helpBtn.on('pointerdown', () => {
            openHelpModal();
        });
        helpBtn.on('pointerover', () => helpBtn.setColor('#00f3ff'));
        helpBtn.on('pointerout', () => helpBtn.setColor('#fff'));


        // Cyberpunk Title
        const titleText = this.add.text(cx, cy - 100, 'GUITAR\nSURVIVOR', {
            fontFamily: 'Orbitron', fontSize: '64px', color: '#00f3ff', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5);
        titleText.setStroke('#bc13fe', 4);
        titleText.setShadow(0, 0, '#00f3ff', 20, true, true);

        // Start Button
        const hasSave = DataManager.load();
        const startText = hasSave ? getTx("CONTINUE") : getTx("GAME_START");

        const btnContainer = this.add.container(cx, cy + 20);
        const btnBg = this.add.rectangle(0, 0, 240, 60, 0x000000).setStrokeStyle(2, 0x00f3ff);
        const btnTxt = this.add.text(0, 0, startText, {
            fontFamily: 'Orbitron', fontSize: '28px', color: '#fff'
        }).setOrigin(0.5);

        btnContainer.add([btnBg, btnTxt]);
        btnContainer.setSize(240, 60).setInteractive();

        btnContainer.on('pointerover', () => { btnBg.setFillStyle(0x00f3ff); btnTxt.setColor('#000'); });
        btnContainer.on('pointerout', () => { btnBg.setFillStyle(0x000000); btnTxt.setColor('#fff'); });
        btnContainer.on('pointerdown', async () => {
            // Dynamic Import Tone.js on user intent (Code Splitting)
            if (!Tone) {
                // Show a mini loading text if network is slow?
                btnTxt.setText("LOADING...");
                try {
                    Tone = await import('tone');
                } catch (e) {
                    console.error("Failed to load audio:", e);
                }
            }

            // ★Tone.start() is required on user interaction
            if (Tone) await Tone.start();

            if (!hasSave) {
                const potion = DataManager.itemMaster.find(i => i.effectType === 'heal_hp');
                if (potion) { DataManager.addItem({ ...potion }); DataManager.addItem({ ...potion }); }
            }
            this.scene.start('map-scene');
        });

        // Reset Button
        if (hasSave) {
            const resetContainer = this.add.container(cx, cy + 100);
            const resetBg = this.add.rectangle(0, 0, 200, 40, 0x000000).setStrokeStyle(1, 0xff0055);
            const resetTxt = this.add.text(0, 0, 'DELETE DATA', {
                fontFamily: 'Orbitron', fontSize: '18px', color: '#ff0055'
            }).setOrigin(0.5);

            resetContainer.add([resetBg, resetTxt]);
            resetContainer.setSize(200, 40).setInteractive();

            resetContainer.on('pointerover', () => { resetBg.setFillStyle(0xff0055); resetTxt.setColor('#000'); });
            resetContainer.on('pointerout', () => { resetBg.setFillStyle(0x000000); resetTxt.setColor('#ff0055'); });
            resetContainer.on('pointerdown', () => {
                if (confirm("WARNING: ERASE ALL DATA?")) {
                    DataManager.resetData();
                }
            });
        }

        // Footer
        const copyright = this.add.text(cx, this.scale.height - 30, '©2026 buro', {
            fontFamily: 'Orbitron', fontSize: '16px', color: '#888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        copyright.on('pointerover', () => copyright.setColor('#00f3ff'));
        copyright.on('pointerout', () => copyright.setColor('#888'));
        copyright.on('pointerdown', () => {
            window.open('https://note.com/jazzy_begin', '_blank');
        });
    }

    createPixelArtTextures() {
        const g = this.make.graphics({ x: 0, y: 0 });

        // Cyberpunk Player (Dark suit, Neon Guitar)
        // Body
        g.fillStyle(0x111111); g.fillRect(6, 4, 4, 8);
        // Head (Helmet)
        g.fillStyle(0x00f3ff); g.fillRect(5, 2, 6, 4);
        // Guitar (Neon Pink)
        g.fillStyle(0xbc13fe); g.beginPath(); g.moveTo(4, 8); g.lineTo(12, 12); g.lineTo(14, 8); g.lineTo(8, 6); g.closePath(); g.fill();
        // Legs
        g.fillStyle(0x333333); g.fillRect(6, 12, 1, 4); g.fillRect(9, 12, 1, 4);
        g.generateTexture('player', 16, 16); g.clear();

        // Cyberpunk Enemy (Glitchy, Neon Green)
        g.fillStyle(0x0aff0a); g.fillRect(4, 4, 8, 8);
        g.fillStyle(0x000000); g.fillRect(5, 5, 2, 2); g.fillRect(9, 5, 2, 2); g.fillRect(6, 9, 4, 1);
        // Spikes
        g.fillStyle(0xff0055); g.fillRect(2, 2, 2, 2); g.fillRect(12, 2, 2, 2); g.fillRect(2, 12, 2, 2); g.fillRect(12, 12, 2, 2);
        g.generateTexture('enemy', 16, 16); g.clear();

        // Cyberpunk Boss (Hexagon-ish, Dark & Red)
        g.fillStyle(0x220000); g.fillCircle(32, 32, 30);
        g.lineStyle(2, 0xff0000); g.strokeCircle(32, 32, 30);
        g.fillStyle(0xff0000); g.fillCircle(20, 20, 5); g.fillCircle(44, 20, 5); // Eyes
        g.fillStyle(0x000000); g.fillRect(24, 40, 16, 4); // Mouth
        // Cyber details
        g.lineStyle(2, 0x00f3ff); g.beginPath(); g.moveTo(10, 32); g.lineTo(54, 32); g.strokePath();
        g.generateTexture('boss', 64, 64); g.clear();

        // Laser Bullet
        g.fillStyle(0x00f3ff); g.fillRect(0, 4, 12, 2);
        g.fillStyle(0xffffff); g.fillRect(0, 4.5, 12, 1);
        g.generateTexture('bullet', 12, 10); g.clear();

        // Treasure - Neon Box
        g.lineStyle(2, 0xf9e504); g.strokeRect(2, 4, 12, 8);
        g.fillStyle(0xf9e504); g.fillRect(4, 6, 8, 4);
        g.generateTexture('treasure', 16, 16); g.clear();

        // Background - Grid
        g.fillStyle(0x050510); g.fillRect(0, 0, 64, 64);
        g.lineStyle(1, 0x1a1a2e);
        g.moveTo(0, 0); g.lineTo(0, 64);
        g.moveTo(0, 0); g.lineTo(64, 0);
        g.strokePath();
        g.generateTexture('background', 64, 64); g.clear();

        // Shadow
        g.fillStyle(0x000000); g.fillEllipse(8, 8, 12, 4);
        g.generateTexture('shadow', 16, 16); g.clear();

        g.destroy();
    }
}


// ==========================================
// シーン1: ワールドマップ
// ==========================================
class MapScene extends Phaser.Scene {
    private txtInfo!: Phaser.GameObjects.Text;
    private txtGuitar!: Phaser.GameObjects.Text;
    private txtGold!: Phaser.GameObjects.Text; // ★Added
    private isMenuOpen: boolean = false;
    private statusTab: 'items' | 'skills' = 'items';

    constructor() { super('map-scene'); }

    create() {
        this.isMenuOpen = false;
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.tileSprite(0, 0, w, h, 'background').setOrigin(0).setTint(0x004400);

        // Header Layout Refined
        this.txtInfo = this.add.text(20, 20, '', { fontSize: '20px', color: '#fff' }); // Lv & HP
        this.txtGuitar = this.add.text(20, 50, '', { fontSize: '16px', color: '#ccc' }); // Guitar Name
        this.txtGold = this.add.text(w - 20, 50, '', { fontSize: '20px', color: '#f9e504' }).setOrigin(1, 0); // Gold (Right aligned)

        this.updateHeader();

        const cx = w / 2;
        const cy = h / 2;
        const stageIdx = DataManager.currentStage - 1;
        const stageName = DataManager.getStageName(stageIdx);

        // Small screen adjustment (prevent overlap with header)
        const isSmallHeight = h < 500;
        const safeTopY = 120; // Text header ends approx at y=70, so 120 is safe
        const studioY = isSmallHeight ? Math.max(safeTopY, cy - 100) : cy - 100;
        const gearY = Math.min(h - 60, cy + 150);

        this.createMapSpot(cx, cy - 50, `🎤 ${getTx('LIVE_START') || "LIVE START"} \nStage ${DataManager.currentStage}: ${stageName} `, 0xff0000, () => {
            if (DataManager.currentStage > 10) { alert("LEGEND! (全クリ済み)"); }
            else {
                DataManager.isPracticeMode = false;
                this.scene.start('game-scene');
            }
        }, 1.5);

        this.createMapSpot(w * 0.2, studioY, '🏚️ STUDIO\n(Practice)', 0xcccccc, () => {
            DataManager.isPracticeMode = true;
            this.scene.start('game-scene');
        });

        this.createMapSpot(w * 0.2, cy + 100, '🏠 SHOP', 0x00ffff, () => this.openShopUI());
        this.createMapSpot(w * 0.8, cy + 100, '🏯 MASTER', 0xffaa00, () => this.openMasterUI());
        this.createMapSpot(cx, gearY, '🎸 GEAR', 0x00ff00, () => this.openStatusUI());

        // Help Button (Map) - Top Right
        const helpBtn = this.add.text(w - 20, 20, getTx('HELP'), {
            fontFamily: 'Orbitron', fontSize: '16px', color: '#fff'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);

        helpBtn.on('pointerdown', () => openHelpModal());
        helpBtn.on('pointerover', () => helpBtn.setColor('#00f3ff'));
        helpBtn.on('pointerout', () => helpBtn.setColor('#fff'));

    }

    updateHeader() {
        this.txtInfo.setText(`Lv.${DataManager.playerLevel}  HP:${DataManager.currentHp}/${DataManager.maxHp}`);
        this.txtGuitar.setText(`GUITAR: ${getTxItemName(DataManager.currentGuitar)}`);
        this.txtGold.setText(`${DataManager.money} G`);

        // Ensure gold stays aligned right if content changes length
        this.txtGold.setX(this.scale.width - 20);
    }

    createMapSpot(x: number, y: number, label: string, color: number, onClick: () => void, scale: number = 1.0) {
        // Create a container for the "Card"
        const container = this.add.container(x, y);
        const size = 100 * scale;

        // Card Background (Dark semitransparent)
        const bg = this.add.rectangle(0, 0, size, size * 0.6, 0x050510, 0.8)
            .setStrokeStyle(2, color);

        // Glow effect (using multiple strokes or just alpha tweening later)
        // For now, simple stroke
        const glow = this.add.rectangle(0, 0, size + 4, (size * 0.6) + 4, color, 0)
            .setStrokeStyle(2, color, 0.3);

        // Label
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Rajdhani',
            fontSize: '18px',
            color: '#fff',
            align: 'center',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        container.add([glow, bg, text]);
        container.setSize(size, size * 0.6);
        container.setInteractive();

        // Hover Effects
        container.on('pointerover', () => {
            bg.setFillStyle(color, 0.2);
            glow.setStrokeStyle(4, color, 0.8);
            this.tweens.add({ targets: container, scale: 1.1, duration: 100 });
        });

        container.on('pointerout', () => {
            bg.setFillStyle(0x050510, 0.8);
            glow.setStrokeStyle(2, color, 0.3);
            this.tweens.add({ targets: container, scale: 1.0, duration: 100 });
        });

        container.on('pointerdown', async () => {
            if (this.isMenuOpen) return;
            if (Tone) {
                await Tone.start();
            }
            this.tweens.add({
                targets: container,
                scale: 0.9,
                duration: 50,
                yoyo: true,
                onComplete: onClick
            });
        });
    }

    getEffectString(item: ItemData): string {
        const val = item.value;
        switch (item.effectType) {
            case 'speed': return `SPD ${val > 0 ? '+' : ''}${val} `; case 'rate': return `RATE x${val} `; case 'size': return `SIZE ${val > 0 ? '+' : ''}${val} `;
            case 'heal_hp': return `HP + ${val} `; case 'heal_mp': return `MP + ${val} `; case 'buff_speed': return `SPEED x2`; default: return '';
        }
    }
    groupItems(items: ItemData[]) {
        const map = new Map<string, { item: ItemData, count: number }>();
        items.forEach(item => { if (!map.has(item.id)) map.set(item.id, { item, count: 0 }); map.get(item.id)!.count++; });
        return Array.from(map.values());
    }
    groupShopItems(items: (ItemData | GuitarData)[]) {
        const map = new Map<string, { item: ItemData | GuitarData, count: number }>();
        items.forEach(item => { if (!map.has(item.id)) map.set(item.id, { item, count: 0 }); map.get(item.id)!.count++; });
        return Array.from(map.values());
    }
    getRarityColor(rarity?: string): string {
        if (rarity === 'legendary') return '#ffaa00';
        if (rarity === 'rare') return '#d400ff';
        return '#00ffff';
    }

    showMessage(message: string, callback?: () => void) {
        const overlay = document.createElement('div');
        overlay.className = 'cyber-overlay';
        const box = document.createElement('div');
        box.className = 'cyber-panel';
        box.style.minWidth = '300px';
        box.style.textAlign = 'center';

        box.innerHTML = `<p style="white-space:pre-wrap;">${message}</p>`;

        const btn = document.createElement('button');
        btn.innerText = 'OK';
        btn.className = 'cyber-btn';
        btn.style.marginTop = '20px';
        btn.onclick = () => { overlay.remove(); if (callback) callback(); };

        box.appendChild(btn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    createBaseUI(title: string) {
        this.isMenuOpen = true;
        const overlay = document.createElement('div');
        overlay.className = 'cyber-overlay';

        const container = document.createElement('div');
        container.className = 'cyber-panel';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        const h2 = document.createElement('h2');
        h2.innerText = title;
        h2.className = 'cyber-title';
        container.appendChild(h2);

        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.overflowY = 'auto';
        content.style.marginBottom = '20px';
        container.appendChild(content);

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'CLOSE';
        closeBtn.className = 'cyber-btn danger';
        closeBtn.style.alignSelf = 'center';
        closeBtn.onclick = () => { overlay.remove(); this.isMenuOpen = false; this.updateHeader(); };
        container.appendChild(closeBtn);

        overlay.appendChild(container); // Wrap panel in overlay
        document.body.appendChild(overlay);

        // Return container as the content helper (actually we return content div)
        // Note: older code returned {container, content}. Now container is inside overlay.
        // We adjust returns to match usage or fix usage.
        // Usage: ui.content.appendChild... ui.container.remove()
        // so we return overlay as 'container' for removal purposes.
        return { container: overlay, content };
    }

    // --- UI Contents ---
    openStatusUI() {
        const ui = this.createBaseUI('GEAR & SKILLS');

        const tabs = document.createElement('div');
        tabs.style.marginBottom = '15px';
        const btnItems = document.createElement('button'); btnItems.innerText = 'INVENTORY'; btnItems.className = 'cyber-btn';
        const btnSkills = document.createElement('button'); btnSkills.innerText = 'SKILLS'; btnSkills.className = 'cyber-btn';

        btnItems.onclick = () => { this.statusTab = 'items'; render(); };
        btnSkills.onclick = () => { this.statusTab = 'skills'; render(); };
        tabs.appendChild(btnItems); tabs.appendChild(btnSkills);
        ui.content.appendChild(tabs);

        const mainArea = document.createElement('div');
        ui.content.appendChild(mainArea);

        const render = () => {
            mainArea.innerHTML = '';
            const stats = DataManager.calculateStats();
            const isWide = window.innerWidth > 800;
            const layout = document.createElement('div');
            layout.style.display = 'grid';
            layout.style.gridTemplateColumns = isWide ? '1fr 1fr 1fr' : '1fr';
            layout.style.gap = '20px';

            // STATS COLUMN
            const colStats = document.createElement('div');
            colStats.innerHTML = `<h3 style="color:var(--neon-blue)">STATUS</h3>
        <p>HP: <span style="color:var(--neon-green)">${DataManager.currentHp}/${DataManager.maxHp}</span></p>
        <p>MP: <span style="color:var(--neon-pink)">${DataManager.currentMp}/${DataManager.maxMp}</span></p>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border:1px solid #333; margin-top:10px;">
          <p>⚡ SPD: <span style="color:var(--neon-yellow)">${Math.round(stats.speed)}</span></p>
          <p>💥 RATE: <span style="color:var(--neon-yellow)">${(1000 / stats.fireRate).toFixed(1)}/s</span></p>
          <p>📏 SIZE: <span style="color:var(--neon-yellow)">${stats.bulletSize}</span></p>
        </div>`;
            layout.appendChild(colStats);

            // EQUIPPED COLUMN
            const colEquip = document.createElement('div');
            colEquip.innerHTML = `<h3 style="color:var(--neon-blue)">LOADOUT</h3>`;

            const divItemBoard = document.createElement('div'); divItemBoard.innerHTML = `<h4>🔧 MODULES</h4>`;
            DataManager.equippedItems.forEach((item, i) => {
                const btn = document.createElement('button');
                btn.className = 'cyber-btn'; btn.style.width = '100%'; btn.style.textAlign = 'left';
                btn.innerHTML = `${getTxItemName(item)} <span style="float:right;color:var(--neon-green)">ON</span><br><small style="color:#aaa">${this.getEffectString(item)}</small>`;
                btn.onclick = () => { DataManager.unequipItem(i); render(); };
                divItemBoard.appendChild(btn);
            });
            colEquip.appendChild(divItemBoard);

            const divSkillDeck = document.createElement('div'); divSkillDeck.style.marginTop = '15px';
            divSkillDeck.innerHTML = `<h4>🧠 SKILLS</h4>`;
            DataManager.equippedSkills.forEach((skill, i) => {
                const btn = document.createElement('button');
                btn.className = 'cyber-btn danger'; btn.style.width = '100%'; btn.style.textAlign = 'left';
                btn.innerHTML = `${getTxItemName(skill)} <span style="float:right">MP:${skill.mpCost}</span>`;
                btn.onclick = () => { DataManager.unequipSkill(i); render(); };
                divSkillDeck.appendChild(btn);
            });
            colEquip.appendChild(divSkillDeck);
            layout.appendChild(colEquip);

            // INVENTORY COLUMN
            const colBag = document.createElement('div');
            const list = document.createElement('div');
            list.style.height = '300px'; list.style.overflowY = 'auto';

            if (this.statusTab === 'items') {
                colBag.innerHTML = `<h3 style="color:var(--neon-blue)">STORAGE</h3>`;
                this.groupItems(DataManager.inventory).forEach(group => {
                    const row = document.createElement('div'); row.className = 'item-list-row';
                    const action = group.item.category === 'consumable' ? 'USE' : 'EQUIP';
                    const color = this.getRarityColor(group.item.rarity);

                    row.innerHTML = `
                  <div style="flex:1">
                    <b style="color:${color}">${getTxItemName(group.item)}</b> x${group.count}<br>
                    <small style="color:#ccc">${getTxItemDesc(group.item)}</small>
                  </div>`;

                    const btn = document.createElement('button');
                    btn.className = 'cyber-btn';
                    btn.innerText = action;
                    btn.onclick = () => {
                        const idx = DataManager.inventory.findIndex(i => i.id === group.item.id);
                        if (idx > -1) {
                            if (group.item.category === 'consumable') {
                                if (DataManager.consumeItem(DataManager.inventory[idx])) { this.showMessage(`Used ${getTxItemName(group.item)}`); render(); }
                                else { this.showMessage("Cannot use now"); }
                            } else {
                                if (DataManager.equippedItems.length >= DataManager.maxEquipSlots) { this.showMessage("Slots Full"); }
                                else { DataManager.equipItem(idx); render(); }
                            }
                        }
                    };
                    row.appendChild(btn);
                    list.appendChild(row);
                });
            } else {
                colBag.innerHTML = `<h3 style="color:var(--neon-blue)">ARCHIVE</h3>`;
                DataManager.skillMaster.filter(s => s.learned).forEach(skill => {
                    const isEquipped = DataManager.equippedSkills.includes(skill);
                    const row = document.createElement('div'); row.className = 'item-list-row';
                    if (isEquipped) row.style.opacity = '0.5';

                    row.innerHTML = `
                  <div style="flex:1">
                    <b style="color:var(--neon-yellow)">${getTxItemName(skill)}</b> <small>MP:${skill.mpCost}</small><br>
                    <small style="color:#ccc">${getTxItemDesc(skill)}</small>
                  </div>`;

                    const btn = document.createElement('button');
                    btn.className = 'cyber-btn';
                    btn.innerText = 'SET';
                    if (!isEquipped) {
                        btn.onclick = () => {
                            if (DataManager.equipSkill(skill.id)) { render(); } else { this.showMessage("Deck Full"); }
                        };
                    } else {
                        btn.style.visibility = 'hidden';
                    }
                    row.appendChild(btn);
                    list.appendChild(row);
                });
            }
            colBag.appendChild(list);
            layout.appendChild(colBag);
            mainArea.appendChild(layout);
        };
        render();
    }

    openShopUI() {
        const ui = this.createBaseUI('NEON MARKET');

        const tabs = document.createElement('div'); tabs.style.marginBottom = '15px';
        const mkTab = (l: string, fn: () => void) => {
            const b = document.createElement('button');
            b.innerText = l; b.className = 'cyber-btn';
            b.onclick = fn; tabs.appendChild(b);
        };
        mkTab('GUITARS', () => list('guitar')); mkTab('EFFECTS', () => list('effect')); mkTab('ITEMS', () => list('accessory')); mkTab('DRUGS', () => list('consumable')); mkTab('SELL', () => sell());
        ui.content.appendChild(tabs);

        const listCont = document.createElement('div');
        listCont.style.minHeight = '300px';
        ui.content.appendChild(listCont);

        const list = (type: string) => {
            listCont.innerHTML = `<h3 style="color:var(--neon-blue)">${type.toUpperCase()}</h3>`;
            const items = DataManager.shopStock.filter(i => type === 'guitar' ? 'tags' in i : (i as ItemData).category === type);
            this.groupShopItems(items).forEach(g => {
                const row = document.createElement('div'); row.className = 'item-list-row';
                const eff = 'tags' in g.item ? `SPD:${(g.item as GuitarData).speed} RATE:${(g.item as GuitarData).fireRate}` : this.getEffectString(g.item as ItemData);
                const color = this.getRarityColor((g.item as ItemData).rarity);

                row.innerHTML = `
              <div style="flex:1">
                <span style="color:${color};font-weight:bold;font-size:1.1em">${getTxItemName(g.item)}</span> x${g.count}<br>
                <span style="color:var(--neon-green)">[${eff}]</span><br>
                <small style="color:#aaa;">${getTxItemDesc(g.item)}</small>
              </div>
              <div style="text-align:right; margin-left:10px;">
                <span style="font-weight:bold;color:var(--neon-yellow);font-size:1.2em">${g.item.price} G</span><br>
                <button class="cyber-btn buy-btn">BUY</button>
              </div>`;

                const btn = row.querySelector('.buy-btn') as HTMLElement;
                btn.onclick = () => {
                    if (DataManager.money >= g.item.price) {
                        const real = DataManager.shopStock.find(i => i.id === g.item.id);
                        if (real) {
                            DataManager.buyItem(real);
                            this.showMessage("Thank you!", () => { this.updateHeader(); list(type); });
                        }
                    } else this.showMessage("Not enough credits.");
                };
                listCont.appendChild(row);
            });
        };

        const sell = () => {
            listCont.innerHTML = `<h3 style="color:var(--neon-pink)">BLACK MARKET (SELL)</h3>`;
            this.groupItems(DataManager.inventory).forEach(g => {
                const row = document.createElement('div'); row.className = 'item-list-row';
                const color = this.getRarityColor(g.item.rarity);

                row.innerHTML = `
              <div style="flex:1">
                <b style="color:${color}">${getTxItemName(g.item)}</b> x${g.count}<br>
                <small>${this.getEffectString(g.item)}</small>
              </div>
              <div>
                <span style="color:var(--neon-yellow)">${Math.floor(g.item.price / 2)} G</span><br>
                <button class="cyber-btn danger sell-btn">SELL</button>
              </div>`;

                const btn = row.querySelector('.sell-btn') as HTMLElement;
                btn.onclick = () => {
                    if (DataManager.sellItemById(g.item.id)) {
                        this.showMessage(`Sold for ${Math.floor(g.item.price / 2)}G`, () => { this.updateHeader(); sell(); });
                    }
                };
                listCont.appendChild(row);
            });
        };
        list('consumable');
    }

    openMasterUI() {
        const ui = this.createBaseUI('DOJO - MASTER');

        const msg = document.createElement('div');
        msg.style.padding = '15px'; msg.style.background = 'rgba(50,0,0,0.5)'; msg.style.border = '1px solid var(--neon-pink)'; msg.style.marginBottom = '20px';
        msg.innerHTML = `<b style="color:var(--neon-yellow)">MASTER</b><br>「Lv.${DataManager.playerLevel}... You survive. Good.」`;
        ui.content.appendChild(msg);

        const list = document.createElement('div');
        ui.content.appendChild(list);

        DataManager.skillMaster.forEach(s => {
            const row = document.createElement('div'); row.className = 'item-list-row';
            if (s.learned) {
                row.innerHTML = `<div style="opacity:0.6"><b>${getTxItemName(s)}</b> <span style="color:var(--neon-green)">[MASTERED]</span><br><small>${getTxItemDesc(s)}</small></div>`;
            }
            else if (DataManager.playerLevel < s.reqLevel) {
                row.style.opacity = '0.5';
                row.innerHTML = `??? <span style="color:var(--neon-pink)">(Req: Lv.${s.reqLevel})</span>`;
            }
            else {
                row.innerHTML = `
              <div style="flex:1">
                <b style="font-size:1.1em; color:var(--neon-blue)">${getTxItemName(s)}</b> <span style="color:#aaa">MP:${s.mpCost}</span><br>
                <small>${getTxItemDesc(s)}</small>
              </div>
              <div style="text-align:right">
                <span style="color:var(--neon-yellow);">${s.price} G</span><br>
                <button class="cyber-btn learn-btn">LEARN</button>
              </div>`;
                const btn = row.querySelector('.learn-btn') as HTMLElement;
                btn.onclick = () => {
                    if (DataManager.money >= s.price) {
                        DataManager.money -= s.price;
                        s.learned = true;
                        this.showMessage("Technique Acquired!", () => { this.updateHeader(); ui.container.remove(); this.openMasterUI(); });
                    } else this.showMessage("Not enough credits.");
                };
            }
            list.appendChild(row);
        });
    }
}


// ==========================================
// シーン2: バトル
// ==========================================
class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Image;
    private enemies!: Phaser.Physics.Arcade.Group;
    private bullets!: Phaser.Physics.Arcade.Group;
    private loots!: Phaser.Physics.Arcade.Group;
    private stats = { speed: 160, fireRate: 500, bulletSize: 20 };
    private lastFired = 0;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    // ★追加: 敵の弾丸グループと、ボスの攻撃タイマー
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private bossLastFired: number = 0;

    // UI
    private hpBar!: Phaser.GameObjects.Rectangle;
    private mpBar!: Phaser.GameObjects.Rectangle;
    private txtStatus!: Phaser.GameObjects.Text;
    private txtObjective!: Phaser.GameObjects.Text;
    private itemLabels: Phaser.GameObjects.Text[] = [];

    private killCount: number = 0;
    private requiredKills: number = 10;
    private isInvincible: boolean = false;
    private synth!: any; // Tone.PolySynth
    private metalSynth!: any; // Tone.PolySynth
    private scaleNotes = ["C4", "Eb4", "F4", "G4", "Bb4", "C5", "Eb5", "F5"];

    // Mobile
    private joyBase!: Phaser.GameObjects.Arc;
    private joyThumb!: Phaser.GameObjects.Arc;
    private joyVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    private isDraggingJoy: boolean = false;
    private itemButtons: Phaser.GameObjects.Rectangle[] = [];
    private skillButtons: Phaser.GameObjects.Arc[] = [];
    private skillLabels: Phaser.GameObjects.Text[] = [];

    // Boss & Buffs
    private isBossActive: boolean = false;
    private bossObject: Phaser.Physics.Arcade.Image | null = null;
    private spawnEvent!: Phaser.Time.TimerEvent;
    private speedBuffActive: boolean = false;

    constructor() { super('game-scene'); }

    create() {
        // ★重要: HTMLのオーバーレイ（ショップなどのUI）が残っていると操作不能になるため強制削除
        document.querySelectorAll('.cyber-overlay').forEach(el => el.remove());

        // ★重要: 物理エンジンを確実に再開させる
        this.physics.resume();

        this.isInvincible = false; this.killCount = 0; this.isBossActive = false; this.bossObject = null; this.speedBuffActive = false;
        const stage = DataManager.currentStage;
        if (DataManager.isPracticeMode) { this.requiredKills = Infinity; }
        else { this.requiredKills = stage * 25; }

        this.stats = DataManager.calculateStats();

        // Audio Init with Safety
        if (Tone) {
            try {
                // Cleanup existing synths if any
                if (this.synth) { try { this.synth.dispose(); } catch (e) { } }
                if (this.metalSynth) { try { this.metalSynth.dispose(); } catch (e) { } }

                Tone.Destination.volume.value = -10;
                const lowPass = new Tone.Filter(3000, "lowpass").toDestination();

                this.synth = new Tone.PolySynth(Tone.Synth, {
                    volume: -10,
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.5 }
                }).connect(lowPass);
                this.synth.maxPolyphony = 4;

                this.metalSynth = new Tone.PolySynth(Tone.MembraneSynth, {
                    volume: -10
                }).connect(lowPass);
                this.metalSynth.maxPolyphony = 2;
            } catch (e) {
                console.error("Audio Init Failed:", e);
            }
        }

        // Handle Scene Shutdown to free resources
        this.events.off('shutdown'); // Remove old listeners to avoid weird stacking
        this.events.on('shutdown', this.shutdown, this);

        const w = this.scale.width;
        const h = this.scale.height;

        this.add.tileSprite(0, 0, w, h, 'background').setOrigin(0);
        this.player = this.physics.add.image(w / 2, h / 2, 'player').setScale(2).setCollideWorldBounds(true);
        this.player.setAlpha(1);
        this.player.setDepth(10);

        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.loots = this.physics.add.group();
        this.cursors = this.input.keyboard!.createCursorKeys();

        this.enemyBullets = this.physics.add.group();

        // Limit max spawn speed (minimum delay 200ms) to prevent crashing or impossible difficulty
        const spawnDelay = Math.max(250, 800 - (stage * 50));
        this.spawnEvent = this.time.addEvent({ delay: spawnDelay, callback: this.spawnEnemy, callbackScope: this, loop: true });

        this.physics.add.overlap(this.bullets, this.enemies, (b, e) => this.hitEnemy(b, e));
        this.physics.add.overlap(this.player, this.loots, (_, l) => this.pickLoot(l));
        this.physics.add.overlap(this.player, this.enemies, (p, e) => this.hitPlayer(p, e));

        this.physics.add.overlap(this.player, this.enemyBullets, (p, b) => {
            this.hitPlayer(p, b);
            b.destroy();
        });

        this.add.rectangle(w - 60, 30, 80, 40, 0x333333).setInteractive().on('pointerdown', () => this.returnToMap()).setScrollFactor(0).setDepth(100);
        this.add.text(w - 60, 30, 'EXIT', { fontSize: '20px' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.createHUD();
        this.createMobileUI();

        if (this.input.keyboard) {
            this.input.keyboard.removeAllKeys(); // Remove old keys
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => this.useSkill(0));
            const numKeys = [
                Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO,
                Phaser.Input.Keyboard.KeyCodes.THREE, Phaser.Input.Keyboard.KeyCodes.FOUR,
                Phaser.Input.Keyboard.KeyCodes.FIVE
            ];
            numKeys.forEach((code, i) => {
                this.input.keyboard!.addKey(code).on('down', () => this.useConsumable(i));
            });
        }
    }

    createMobileUI() {
        // ★重要: UI配列を初期化 (シーン再開時に重複しないように)
        this.itemButtons = [];
        this.skillButtons = [];
        this.itemLabels = [];
        this.skillLabels = [];

        const w = this.scale.width;
        const h = this.scale.height;
        this.joyBase = this.add.circle(100, h - 100, 60, 0x888888, 0.5).setScrollFactor(0).setDepth(100).setVisible(false);
        this.joyThumb = this.add.circle(100, h - 100, 30, 0xffffff, 0.8).setScrollFactor(0).setDepth(100).setVisible(false);

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.x < w / 2 && pointer.y > h / 2) {
                this.isDraggingJoy = true;
                this.joyBase.setPosition(pointer.x, pointer.y).setVisible(true);
                this.joyThumb.setPosition(pointer.x, pointer.y).setVisible(true);
                this.joyVector.set(0, 0);
            }
        });
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingJoy) {
                const dist = Phaser.Math.Distance.Between(this.joyBase.x, this.joyBase.y, pointer.x, pointer.y);
                const angle = Phaser.Math.Angle.Between(this.joyBase.x, this.joyBase.y, pointer.x, pointer.y);
                const thumbDist = Math.min(dist, 60);
                this.joyThumb.x = this.joyBase.x + Math.cos(angle) * thumbDist;
                this.joyThumb.y = this.joyBase.y + Math.sin(angle) * thumbDist;
                this.joyVector.set(Math.cos(angle), Math.sin(angle));
                if (dist < 10) this.joyVector.set(0, 0);
            }
        });
        this.input.on('pointerup', () => {
            this.isDraggingJoy = false;
            this.joyBase.setVisible(false);
            this.joyThumb.setVisible(false);
            this.joyVector.set(0, 0);
        });

        // スキルボタン
        for (let i = 0; i < 3; i++) {
            const offsetX = (i * 60);
            const btn = this.add.circle(w - 160 + offsetX, h - 100, 25, 0xff0000, 0.5)
                .setScrollFactor(0).setDepth(100).setInteractive();
            const lbl = this.add.text(btn.x, btn.y, `S${i + 1}`, { fontSize: '14px' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
            btn.on('pointerdown', () => this.useSkill(i));

            this.skillButtons.push(btn);
            this.skillLabels.push(lbl);
        }

        // アイテムボタン
        const startX = w / 2 - 140;
        for (let i = 0; i < 5; i++) {
            const btn = this.add.rectangle(startX + (i * 70), h - 40, 60, 60, 0x00ff00, 0.3).setScrollFactor(0).setDepth(100).setInteractive();
            btn.setStrokeStyle(2, 0xffffff);
            this.add.text(btn.x, btn.y + 20, `${i + 1}`, { fontSize: '14px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

            // アイテム名表示用のラベル (ボタンの上に表示)
            const lbl = this.add.text(btn.x, btn.y - 10, "", { fontSize: '10px', color: '#fff', align: 'center', wordWrap: { width: 58 } })
                .setOrigin(0.5).setScrollFactor(0).setDepth(101);
            this.itemLabels.push(lbl);

            btn.on('pointerdown', () => this.useConsumable(i));
            this.itemButtons.push(btn);
        }
    }

    useSkill(index: number) {
        const skill = DataManager.equippedSkills[index];
        if (skill) {
            if (skill.type === 'Active') {
                if (skill.id === 'S009') this.tryActivateSkill(skill.mpCost, () => this.activateSweepPicking());
                else if (skill.id === 'S007') this.tryActivateSkill(skill.mpCost, () => this.activatePowerChord());
                else if (skill.id === 'S006') this.tryActivateSkill(skill.mpCost, () => this.activateVibrato());
                else this.showMessageFloat("Active Skill Used!");
            } else {
                this.showMessageFloat("Passive (Auto)");
            }
        } else {
            this.showMessageFloat("No Skill");
        }
    }

    activateSweepPicking() {
        const c = this.add.circle(this.player.x, this.player.y, 100, 0x00ffff, 0.3);
        this.physics.add.existing(c);
        ["C4", "E4", "G4", "C5"].forEach((n, i) => { this.synth.triggerAttackRelease(n, "32n", Tone.now() + (i * 0.05)); });
        this.physics.add.overlap(c, this.enemies, (_, e) => { this.hitEnemy(c, e); });
        this.tweens.add({ targets: c, alpha: 0, scale: 1.5, duration: 300, onComplete: () => c.destroy() });
    }

    activatePowerChord() {
        const b = this.bullets.create(this.player.x, this.player.y, 'bullet').setTint(0xff0000).setScale(3);
        const angle = this.player.flipX ? Math.PI : 0;
        const vec = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(600);
        b.body.velocity.set(vec.x, vec.y);
        this.metalSynth.triggerAttackRelease("E2", "8n");
        this.time.delayedCall(2000, () => b.destroy());
    }

    activateVibrato() {
        const c = this.add.circle(this.player.x, this.player.y, 150, 0xff00ff, 0.2);
        this.physics.add.existing(c);
        this.physics.add.overlap(c, this.enemies, (_, e: any) => {
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, e.x, e.y);
            const vec = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(300);
            e.body.velocity.set(vec.x, vec.y);
        });
        this.synth.triggerAttackRelease(["C3", "C#3"], "16n");
        this.tweens.add({ targets: c, alpha: 0, scale: 1.2, duration: 200, onComplete: () => c.destroy() });
    }

    showMessageFloat(msg: string) {
        const t = this.add.text(this.player.x, this.player.y - 40, msg, {
            fontFamily: 'Orbitron', fontSize: '20px', color: '#00f3ff', stroke: '#000', strokeThickness: 4, shadow: { offsetX: 0, offsetY: 0, color: '#bc13fe', blur: 10, fill: true, stroke: true }
        }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: this.player.y - 80, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
    }

    createHUD() {
        const cx = this.scale.width / 2;

        // HP Bar Container
        this.add.text(20, 20, "HP", { fontFamily: 'Rajdhani', fontSize: '18px', color: '#0aff0a' }).setScrollFactor(0).setDepth(100);
        this.add.rectangle(50, 28, 204, 16, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(99).setStrokeStyle(1, 0x0aff0a);
        this.hpBar = this.add.rectangle(52, 30, 200, 12, 0x0aff0a).setOrigin(0).setScrollFactor(0).setDepth(100);

        // MP Bar Container
        this.add.text(20, 50, "MP", { fontFamily: 'Rajdhani', fontSize: '18px', color: '#bc13fe' }).setScrollFactor(0).setDepth(100);
        this.add.rectangle(50, 58, 204, 16, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(99).setStrokeStyle(1, 0xbc13fe);
        this.mpBar = this.add.rectangle(52, 60, 200, 12, 0xbc13fe).setOrigin(0).setScrollFactor(0).setDepth(100);

        // Text Status
        this.txtStatus = this.add.text(270, 30, "", { fontFamily: 'Rajdhani', fontSize: '16px', color: '#fff' }).setScrollFactor(0).setDepth(100);

        const stageName = DataManager.getStageName(DataManager.currentStage - 1);
        let title = `Stage ${DataManager.currentStage}: ${stageName}`;
        if (DataManager.isPracticeMode) title = "STUDIO (Practice Mode)";

        // Stage Title
        this.add.text(cx, 80, title, {
            fontFamily: 'Orbitron', fontSize: '24px', color: '#fff', stroke: '#00f3ff', strokeThickness: 2
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

        // Objective Text
        this.txtObjective = this.add.text(cx, 110, "", {
            fontFamily: 'Orbitron', fontSize: '20px', color: '#f9e504', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

        this.updateHUD();
    }

    updateHUD() {
        const hpRatio = Math.max(0, DataManager.currentHp / DataManager.maxHp);
        this.hpBar.width = 200 * hpRatio;
        const mpRatio = Math.max(0, DataManager.currentMp / DataManager.maxMp);
        this.mpBar.width = 200 * mpRatio;
        this.txtStatus.setText(`${DataManager.currentHp}/${DataManager.maxHp}\n${DataManager.currentMp}/${DataManager.maxMp}`);

        const consumables = DataManager.inventory.filter(i => i.category === 'consumable');
        this.itemButtons.forEach((btn: any, i) => {
            if (consumables[i]) {
                btn.setFillStyle(0x00ff00, 0.5);
                btn.setStrokeStyle(2, 0x0aff0a);
                this.itemLabels[i].setText(getTxItemName(consumables[i]).substring(0, 10));
            } else {
                btn.setFillStyle(0x111111, 0.8);
                btn.setStrokeStyle(1, 0x333333);
                this.itemLabels[i].setText("EMPTY");
            }
        });

        this.skillButtons.forEach((btn, i) => {
            const s = DataManager.equippedSkills[i];
            if (s) {
                // Active: Red/Pink, Passive: Blue
                const color = s.type === 'Active' ? 0xff0055 : 0x00f3ff;
                btn.setFillStyle(color, 0.5);
                btn.setStrokeStyle(2, color);
                this.skillLabels[i].setText(s.type === 'Active' ? 'ACT' : 'PAS');
            } else {
                btn.setFillStyle(0x110000, 0.8);
                btn.setStrokeStyle(1, 0x330000);
                this.skillLabels[i].setText(`S${i + 1}`);
            }
        });

        if (DataManager.isPracticeMode) this.txtObjective.setText(`KILLS: ${this.killCount} (Endless)`);
        else if (this.isBossActive) this.txtObjective.setText(`WARNING: BOSS BATTLE!`);
        else this.txtObjective.setText(`KILLS: ${this.killCount} / ${this.requiredKills}`);
    }

    useConsumable(index: number) {
        const items = DataManager.inventory.filter(i => i.category === 'consumable');
        if (items[index]) {
            const res = DataManager.consumeItem(items[index]);
            if (res.success) {
                this.metalSynth.triggerAttackRelease("C6", "16n");
                if (res.type === 'buff_speed') this.applyBuff('speed');
                this.updateHUD();
                this.showMessageFloat("USED!");
            } else {
                this.showMessageFloat("FULL!");
            }
        } else {
            this.showMessageFloat("EMPTY!");
        }
    }

    applyBuff(type: string) {
        if (type === 'speed') {
            this.speedBuffActive = true;
            this.player.setTint(0x00ffff);
            this.time.delayedCall(10000, () => {
                this.speedBuffActive = false;
                this.player.clearTint();
                this.showMessageFloat("Speed Normal");
            });
            this.showMessageFloat("Speed UP! (10s)");
        }
    }

    tryActivateSkill(cost: number, action: () => void) {
        if (DataManager.currentMp >= cost) {
            DataManager.currentMp -= cost; action(); this.updateHUD();
        } else {
            this.showMessageFloat("NO MP!");
        }
    }

    hitPlayer(_player: any, _enemy: any) {
        if (this.isInvincible) return;
        DataManager.currentHp -= 10; this.updateHUD();
        this.cameras.main.shake(100, 0.01); this.synth.triggerAttackRelease(["C2", "F#2"], "8n");
        if (DataManager.currentHp <= 0) this.gameOver();
        else {
            this.isInvincible = true; this.player.setAlpha(0.5);
            this.time.delayedCall(1000, () => { this.isInvincible = false; this.player.setAlpha(1); });
        }
    }

    update(time: number) {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown) vx = -1; else if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1; else if (this.cursors.down.isDown) vy = 1;

        if (this.isDraggingJoy) { vx = this.joyVector.x; vy = this.joyVector.y; }

        const buffMult = this.speedBuffActive ? 2.0 : 1.0;
        const vec = new Phaser.Math.Vector2(vx, vy).normalize().scale(this.stats.speed * buffMult);

        if (vx === 0 && vy === 0) body.setVelocity(0, 0); else body.setVelocity(vec.x, vec.y);
        if (vx < 0) this.player.setFlipX(true); else if (vx > 0) this.player.setFlipX(false);

        if (time > this.lastFired) {
            const target = this.getNearestEnemy();
            if (target) { this.fireBullet(target); this.lastFired = time + this.stats.fireRate; }
        }
        const speed = 80 + (DataManager.currentStage * 10);
        this.enemies.getChildren().forEach((e: any) => this.physics.moveToObject(e, this.player, speed));

        if (this.isBossActive && this.bossObject) {
            this.physics.moveToObject(this.bossObject, this.player, 50);
        }

        // ★追加: ボスの攻撃判定 (1.5秒ごとに発射)
        if (time > this.bossLastFired + 1500) {
            this.bossFire();
            this.bossLastFired = time;
        }

        // Cleanup Logic Optimized: 
        // We rely on time.delayedCall in fireBullet to destroy bullets. 
        // No need for per-frame O(N) loop here.
    }


    spawnEnemy() {
        if (this.isBossActive) return;
        const w = this.scale.width; const h = this.scale.height;

        let x, y;
        const side = Phaser.Math.Between(0, 3);
        switch (side) {
            case 0: x = -50; y = Phaser.Math.Between(0, h); break; // Left
            case 1: x = w + 50; y = Phaser.Math.Between(0, h); break; // Right
            case 2: x = Phaser.Math.Between(0, w); y = -50; break; // Top
            case 3: x = Phaser.Math.Between(0, w); y = h + 50; break; // Bottom
        }

        this.enemies.create(x, y, 'enemy').setScale(2);
    }

    spawnBoss() {
        this.isBossActive = true;
        this.spawnEvent.remove();
        this.enemies.clear(true, true);
        const w = this.scale.width;
        this.bossObject = this.physics.add.image(w / 2, -100, 'boss').setScale(3);
        this.bossObject.setData('hp', DataManager.currentStage * 500);
        this.enemies.add(this.bossObject);
        this.showMessageFloat("BOSS APPEARED!");
        this.synth.triggerAttackRelease(["C2", "G2"], "2n");
    }


    hitEnemy(bullet: any, enemy: any) {
        bullet.destroy();

        if (enemy === this.bossObject) {
            let hp = enemy.getData('hp');
            hp -= this.stats.bulletSize;
            enemy.setData('hp', hp);
            this.showMessageFloat(`${hp}`);
            if (hp <= 0) {
                enemy.destroy();
                this.bossObject = null;
                this.stageClear();
            } else {
                this.tweens.add({ targets: enemy, alpha: 0.5, duration: 50, yoyo: true });
            }
            return;
        }

        if (Math.random() < 0.2) this.spawnLoot(enemy.x, enemy.y);
        else {
            DataManager.money += 10;
            if (DataManager.gainExp(1)) {
                this.updateHUD();
                this.showMessageFloat("LEVEL UP!");
            }
        }
        this.playRandomLick();
        this.tweens.add({ targets: enemy, scale: 0, duration: 200, onComplete: () => enemy.destroy() });

        this.killCount++; this.updateHUD();
        if (!DataManager.isPracticeMode && !this.isBossActive && this.killCount >= this.requiredKills) {
            this.spawnBoss();
        }
    }

    stageClear() {
        this.physics.pause();
        this.isBossActive = false;
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n");
        const txt = this.add.text(this.scale.width / 2, this.scale.height / 2, "STAGE CLEAR!", { fontSize: '64px', color: '#ff0', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        if (DataManager.currentStage < 10) {
            DataManager.currentStage++;
            DataManager.save();
            this.time.delayedCall(3000, () => this.returnToMap());
        } else {
            txt.setText("LEGENDARY!");
            this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, "BUDOKAN CONQUERED", { fontSize: '32px', color: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
            DataManager.save();
            this.time.delayedCall(6000, () => this.returnToMap());
        }
    }

    playRandomLick() {
        const note = this.scaleNotes[Phaser.Math.Between(0, this.scaleNotes.length - 1)];
        this.synth.triggerAttackRelease(note, "16n");
    }

    spawnLoot(x: number, y: number) {
        const loot = this.loots.create(x, y, 'treasure').setScale(1.5);
        const rarityChance = Math.random();
        let targetRarity = 'common';
        if (rarityChance < 0.05) targetRarity = 'legendary';
        else if (rarityChance < 0.2) targetRarity = 'rare';

        const pool = DataManager.itemMaster.filter(i => i.rarity === targetRarity || i.rarity === 'common');
        const item = pool.length ? pool[Phaser.Math.Between(0, pool.length - 1)] : DataManager.itemMaster[0];

        loot.setData('itemData', item);
        this.tweens.add({ targets: loot, y: y - 10, duration: 500, yoyo: true, repeat: -1 });
    }

    pickLoot(loot: any) {
        const item = loot.getData('itemData') as ItemData;
        DataManager.addItem(item);
        this.showMessageFloat(`${getTxItemName(item)} GET!`);
        this.updateHUD(); this.metalSynth.triggerAttackRelease("C6", "32n"); loot.destroy();
    }

    getNearestEnemy(): Phaser.GameObjects.GameObject | null {
        if (this.isBossActive && this.bossObject) return this.bossObject;
        let nearest: any = null;
        let minDistSq = 1000 * 1000;
        const px = this.player.x, py = this.player.y;
        const enemies = this.enemies.getChildren();
        for (let i = 0; i < enemies.length; i++) {
            const e: any = enemies[i];
            if (e.active) {
                const dx = e.x - px;
                const dy = e.y - py;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistSq) { minDistSq = distSq; nearest = e; }
            }
        }
        return nearest;
    }

    fireBullet(target: any) {
        const b = this.bullets.create(this.player.x, this.player.y, 'bullet');
        // Disable world bounds so they can fly off-screen and not stuck at edges
        // b.body.setCollideWorldBounds(true); 

        // Manual out-of-bounds kill using a timer
        this.time.delayedCall(3000, () => { if (b.active) b.destroy(); }); // Hard cap lifetime

        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
        // Reduce speed slightly for stability or keep as is
        const vec = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(this.stats.speed + 200);
        b.setVelocity(vec.x, vec.y);
        b.setRotation(angle);

        // Tone.js Mobile Optimization: Limit polyphony or skip if too busy
        if (Tone && Tone.context.state === 'running') {
            try {
                // If many bullets, skip sound occasionally
                if (Math.random() > 0.3) {
                    this.synth.triggerAttackRelease("C4", "32n", undefined, 0.1);
                }
            } catch (e) {
                // ignore audio errors
            }
        }
    }

    // ★新規追加: ボスの攻撃ロジック
    bossFire() {
        if (!this.bossObject || !this.bossObject.active) return;

        // ステージ数に応じて弾の数を計算 (例: ステージ1=3発, ステージ10=12発)
        // 難易度調整はお好みで数値をいじってください
        const bulletCount = 3 + (DataManager.currentStage - 1);

        // プレイヤーへの角度
        const angleToPlayer = Phaser.Math.Angle.Between(this.bossObject.x, this.bossObject.y, this.player.x, this.player.y);

        // 扇状に撃つための拡散角度 (全体で60度くらい広げる)
        const spread = 0.5; // ラジアン
        const startAngle = angleToPlayer - spread / 2;
        const step = spread / (bulletCount > 1 ? bulletCount - 1 : 1);

        // 音を鳴らす (低めの音で威圧感)
        this.metalSynth.triggerAttackRelease("C2", "16n");

        for (let i = 0; i < bulletCount; i++) {
            const angle = startAngle + (step * i);

            // 弾を生成
            const b = this.enemyBullets.create(this.bossObject.x, this.bossObject.y, 'bullet');
            b.setTint(0xff00ff); // 敵の弾は紫色にする
            b.setScale(1.5);     // 少し大きくする

            // 速度ベクトルを計算 (速度 200)
            const vec = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(200);
            b.setVelocity(vec.x, vec.y);

            // 回転アニメーション
            this.tweens.add({ targets: b, angle: 360, duration: 300, repeat: -1 });

            // 3秒後に消滅 (画面外に永遠に残るのを防ぐ)
            this.time.delayedCall(3000, () => {
                if (b.active) b.destroy();
            });
        }
    }

    returnToMap() {
        this.physics.pause();
        this.scene.start('map-scene');
    }

    private gameOverText: Phaser.GameObjects.Text | null = null;

    gameOver() {
        this.physics.pause();
        if (this.gameOverText) this.gameOverText.destroy();

        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
            fontSize: '64px', color: '#f00', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        DataManager.currentHp = DataManager.maxHp;
        DataManager.currentMp = DataManager.maxMp;

        // Use Phaser timer instead of setTimeout so it gets cleared on shutdown
        this.time.delayedCall(3000, () => {
            this.returnToMap();
        });
    }

    shutdown() {
        // ★重要: シーン終了時に全てのプロセスを完全に停止・破棄する
        try {
            if (this.gameOverText) {
                this.gameOverText.destroy();
                this.gameOverText = null;
            }
            // 1. Stop all Timers and Tweens
            this.time.removeAllEvents();
            this.tweens.killAll();

            // 2. Clear Physics groups explicitly
            if (this.enemies) this.enemies.clear(true, true);
            if (this.bullets) this.bullets.clear(true, true);
            if (this.enemyBullets) this.enemyBullets.clear(true, true);
            if (this.loots) this.loots.clear(true, true);

            // 3. Audio Cleanup (Tone.js nodes)
            if (this.synth) { try { this.synth.dispose(); } catch (e) { } this.synth = null; }
            if (this.metalSynth) { try { this.metalSynth.dispose(); } catch (e) { } this.metalSynth = null; }

            // 4. Input Cleanup
            if (this.input.keyboard) this.input.keyboard.removeAllKeys();
            this.input.removeAllListeners();
        } catch (e) {
            console.error("Shutdown Cleanup Error:", e);
        }
    }
}

if (import.meta.hot) { import.meta.hot.accept(() => { window.location.reload(); }); }

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    backgroundColor: '#000000', // ★明示的に背景色を黒に設定
    scale: {
        mode: Phaser.Scale.RESIZE, // ★完全レスポンシブ
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // ★重要: モバイルでの高解像度レンダリングを無効化 (ScaleConfigではなくGameConfigのルートプロパティ)
    // @ts-ignore
    resolution: 1,
    // ★重要: FPSを30に制限して負荷を下げる（スマホ対策）
    fps: {
        target: 30,
        forceSetTimeOut: true
    },
    parent: 'app',
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scene: [BootScene, MapScene, GameScene],
    pixelArt: true,
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
        powerPreference: 'high-performance'
    }
};

new Phaser.Game(config);