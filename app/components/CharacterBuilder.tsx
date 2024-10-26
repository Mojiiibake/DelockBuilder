'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import ItemGrid from './ItemGrid';
import StatsSidebar from './StatsSidebar';
import { ItemsDisplay, getCategory } from './ItemsDisplay';
import { AWithKey, SkillsData, skillProperties, skillDisplayGroups, skillUpgrades, skillScaleData, skillnamemap } from '../lib/abilityInterface';
import { upgradesWithName } from '../lib/itemInterfaces';
import { heroesWithName, m_MLI } from '../lib/herointerfaces';
import { allStats } from '../lib/dataUtils';
import Navbar from '../ui/Navbar';

interface ItemModifier {
    itemkey: string;
    modifiers: { [key: string]: number };
}

interface CharacterBuilderProps {
    characterNameFromMap: string
    character: heroesWithName;
    items: upgradesWithName[];
    initialStats: allStats;
    abilities: AWithKey[];
}


const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ characterNameFromMap, character, items, initialStats, abilities }) => {

    const heroName = character.name.replace(/^hero_/, '').replace(/^\w/, c => c.toUpperCase());
    const actualname = characterNameFromMap;

    // Getting Skills Data
    let heroSkills = [] as SkillsData[]; // Array of ESlot_Signature_# from HeroAbilityStats.json
    let skillProps = [{}, {}, {}, {}] as skillProperties[]; // Stores non-zero properties from m_mapAbilityProperties in each skill
    let skillDG = [[], [], [], []] as skillDisplayGroups[][]; // Stores the property name and key to use for StatsSidebar
    let skillIcons: Array<string> = [] //Stores skill icon paths in array
    let skillUpgradeInfo = [[], [], [], []] as skillUpgrades[][]; // Stores upgrade tiers for each skill
    let skillScaling = [{}, {}, {}, {}] as skillScaleData[]; // Stores Scaling data for each skill

    // Retrieve all ESlot_Signature_# parts from HeroAbilityStats.json

    for (let i = 0; i < abilities.length; i++) {
        if (abilities[i].heroname === character.name) {
            heroSkills = [JSON.parse(JSON.stringify(abilities[i].adata.ESlot_Signature_1)),
            JSON.parse(JSON.stringify(abilities[i].adata.ESlot_Signature_2)),
            JSON.parse(JSON.stringify(abilities[i].adata.ESlot_Signature_3)),
            JSON.parse(JSON.stringify(abilities[i].adata.ESlot_Signature_4))];
            break;
        }


    }
    // Retrieves non-zero skill properties & skill image path
    heroSkills.forEach((element, index) => {
        for (const [skey, value] of Object.entries(element.m_mapAbilityProperties)) {
            if (parseFloat(value.m_strValue) !== 0) {
                skillProps[index][skey] = parseFloat(value.m_strValue);
                if (value.m_subclassScaleFunction && value.m_subclassScaleFunction.subclass.m_bFunctionDisabled !== true) {
                    skillScaling[index][skey] = value.m_subclassScaleFunction.subclass;
                }
            }
        }

        skillUpgradeInfo[index] = element.m_vecAbilityUpgrades;

        skillIcons[index] = element.m_strAbilityImage.replace(/^panorama:"/, '').replace(/"$/, '').replace('.psd', '_psd.png');

    })

    for (let i = 0; i < skillProps.length; i++) {
        const sProp = skillProps[i];
        let skey: keyof typeof sProp;
        for (skey in sProp) {
            let slabel: string;

            if (skey.includes("Ability")) {
                slabel = skey.replace("Ability", '').replace(/([A-Z])/g, ' $1').trim();
            } else {
                slabel = skey.replace(/([A-Z])/g, ' $1').trim();
            }
            skillDG[i].push({
                key: skey,
                name: slabel,
                skillName: heroSkills[i]._class
            })
        }
    }
    const [searchTerm, setSearchTerm] = useState('');
    const [weaponItems, setWeaponItems] = useState<(upgradesWithName | null)[]>(Array(4).fill(null));
    const [vitalityItems, setVitalityItems] = useState<(upgradesWithName | null)[]>(Array(4).fill(null));
    const [spiritItems, setSpiritItems] = useState<(upgradesWithName | null)[]>(Array(4).fill(null));
    const [utilityItems, setUtilityItems] = useState<(upgradesWithName | null)[]>(Array(4).fill(null));
    const [currentStats, setCurrentStats] = useState<allStats>(initialStats);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [skillUpgrades, setskillUpgrades] = useState<skillUpgrades[][]>(
        skillUpgradeInfo.map(() => [])
    );
    const [skillStats, setSkillStats] = useState<skillProperties[]>(skillProps);
    const [characterLevel, setCharacterLevel] = useState(1);
    const [budget, setBudget] = useState(0);
    const maxLevel = Object.keys(character.data.m_mapLevelInfo).length;
    const [leveledStats, setLeveledStats] = useState<allStats>(initialStats);
    const [abilityPoints, setAbilityPoints] = useState<number>(0);

    useEffect(() => {
        let newLeveledStats = { ...initialStats };
        let newAbilityPoints = 0;
        let totalStandardUpgrades = 0;

        for (let level = 1; level <= characterLevel; level++) {
            const levelInfo = (character.data as any).m_mapLevelInfo[level.toString()];

            if (levelInfo) {
                if (level === characterLevel) {
                    setBudget(levelInfo.m_unRequiredGold);
                }

                if (levelInfo.m_mapBonusCurrencies && 'EAbilityPoints' in levelInfo.m_mapBonusCurrencies) {
                    newAbilityPoints += levelInfo.m_mapBonusCurrencies.EAbilityPoints;
                }

                if (levelInfo.m_bUseStandardUpgrade) {
                    totalStandardUpgrades++;
                }
            }
        }

        if (totalStandardUpgrades > 0) {
            const levelUpgrades = (character.data as any).m_mapStandardLevelUpUpgrades;

            const meleeDamageIncrease = (levelUpgrades.MODIFIER_VALUE_BASE_MELEE_DAMAGE_FROM_LEVEL || 0) * totalStandardUpgrades;

            newLeveledStats.EBulletDamage += (levelUpgrades.MODIFIER_VALUE_BASE_BULLET_DAMAGE_FROM_LEVEL || 0) * totalStandardUpgrades;
            newLeveledStats.ELightMeleeDamage += meleeDamageIncrease;

            const heavyToLightRatio = initialStats.EHeavyMeleeDamage / initialStats.ELightMeleeDamage;

            newLeveledStats.EHeavyMeleeDamage += meleeDamageIncrease * heavyToLightRatio;

            newLeveledStats.EMaxHealth += (levelUpgrades.MODIFIER_VALUE_BASE_HEALTH_FROM_LEVEL || 0) * totalStandardUpgrades;
        }

        setLeveledStats(newLeveledStats);
        setAbilityPoints(newAbilityPoints);

    }, [characterLevel, character.data, initialStats]);

    const handleLevelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newLevel = parseInt(event.target.value, 10);
        setCharacterLevel(newLevel);
    };

    const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newBudget = parseInt(event.target.value, 10);
        setBudget(Math.max(newBudget, character.data.m_mapLevelInfo[characterLevel.toString() as keyof typeof character.data.m_mapLevelInfo]['m_unRequiredGold']));
    };



    useEffect(() => {
        const allEquippedItems = [...weaponItems, ...vitalityItems, ...spiritItems, ...utilityItems].filter(
            (item): item is upgradesWithName => item !== null
        );

        fetch('/api/calculateStats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                characterName: character.name.replace(/^hero_/, ''),
                equippedItems: allEquippedItems,
                characterStatInput: leveledStats, // Use leveledStats instead of currentStats
                heroSkills: heroSkills,
                skillProperties: skillProps,
                skillUpgrades: skillUpgrades,
                skillScaleData: skillScaling,
            }),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || 'Network response was not ok') });
                }
                return response.json();
            })
            .then(newStats => {
                setCurrentStats(newStats.characterStats);
                setSkillStats(newStats.skillStats);
            })
            .catch(error => {
                console.error('Error calculating stats:', error);
                setErrorMessage(error.message || 'Error calculating stats');
            });
    }, [character, weaponItems, vitalityItems, spiritItems, utilityItems, skillUpgrades, leveledStats]);

    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        const allEquippedItems = [...weaponItems, ...vitalityItems, ...spiritItems, ...utilityItems].filter(
            (item): item is upgradesWithName => item !== null
        );
        const newTotalCost = allEquippedItems.reduce((sum, item) => {
            const tierCost = {
                "EModTier_1": 500,
                "EModTier_2": 1250,
                "EModTier_3": 3000,
                "EModTier_4": 6200
            };
            return sum + (tierCost[item.desc.m_iItemTier as keyof typeof tierCost] || 0);
        }, 0);
        setTotalCost(newTotalCost);
    }, [weaponItems, vitalityItems, spiritItems, utilityItems]);

    const handleItemToggle = (item: upgradesWithName) => {
        const category = getCategory(item.desc.m_eItemSlotType as string || '');
        let primaryGrid: (upgradesWithName | null)[];
        let setPrimaryGrid: React.Dispatch<React.SetStateAction<(upgradesWithName | null)[]>>;

        switch (category) {
            case 'Weapon':
                primaryGrid = weaponItems;
                setPrimaryGrid = setWeaponItems;
                break;
            case 'Vitality':
                primaryGrid = vitalityItems;
                setPrimaryGrid = setVitalityItems;
                break;
            case 'Spirit':
                primaryGrid = spiritItems;
                setPrimaryGrid = setSpiritItems;
                break;
            default:
                primaryGrid = utilityItems;
                setPrimaryGrid = setUtilityItems;
                break;
        }

        const existingIndex = [
            ...weaponItems,
            ...vitalityItems,
            ...spiritItems,
            ...utilityItems
        ].findIndex(equippedItem => equippedItem?.name === item.name);

        if (existingIndex !== -1) {
            // Item is already equipped, so unequip it
            const gridToUpdate = existingIndex < 4 ? setWeaponItems :
                existingIndex < 8 ? setVitalityItems :
                    existingIndex < 12 ? setSpiritItems :
                        setUtilityItems;

            gridToUpdate(prev => {
                const newGrid = [...prev];
                newGrid[existingIndex % 4] = null;
                return newGrid;
            });
        } else {
            // Item is not equipped, so try to equip it
            const tierCost = {
                "EModTier_1": 500,
                "EModTier_2": 1250,
                "EModTier_3": 3000,
                "EModTier_4": 6200
            };
            const itemCost = tierCost[item.desc.m_iItemTier as keyof typeof tierCost] || 0;

            if (totalCost + itemCost > budget) {
                setErrorMessage('Not enough budget to equip this item!');
                setTimeout(() => setErrorMessage(null), 3000);
                return;
            }

            const emptyIndex = primaryGrid.findIndex(slot => slot === null);
            if (emptyIndex !== -1) {
                // There's space in the primary grid
                setPrimaryGrid(prev => {
                    const newGrid = [...prev];
                    newGrid[emptyIndex] = item;
                    return newGrid;
                });
            } else if (category !== 'Utility') {
                // Primary grid is full, try to place in utility grid
                const utilityEmptyIndex = utilityItems.findIndex(slot => slot === null);
                if (utilityEmptyIndex !== -1) {
                    setUtilityItems(prev => {
                        const newGrid = [...prev];
                        newGrid[utilityEmptyIndex] = item;
                        return newGrid;
                    });
                } else {
                    setErrorMessage('No empty slots available!');
                    setTimeout(() => setErrorMessage(null), 3000);
                }
            } else {
                setErrorMessage('No empty slots available!');
                setTimeout(() => setErrorMessage(null), 3000);
            }
        }
    };


    const handleSkillUpgrade = (skillIndex: number) => {
        setskillUpgrades(prevUpgrades => {
            const newUpgrades = [...prevUpgrades];
            const currentUpgradeLevel = newUpgrades[skillIndex].length;

            if (currentUpgradeLevel < skillUpgradeInfo[skillIndex].length) {
                newUpgrades[skillIndex] = skillUpgradeInfo[skillIndex].slice(0, currentUpgradeLevel + 1);
            } else {
                newUpgrades[skillIndex] = [];
            }
            //console.log(`Skill ${skillIndex + 1} upgraded. New state:`, newUpgrades);
            return newUpgrades;
        });
    };

    const getEquippedItemsbyCategory = () => { return [weaponItems, vitalityItems, spiritItems, utilityItems] };
    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allEquippedItems = [...weaponItems, ...vitalityItems, ...spiritItems, ...utilityItems].filter(
        (item): item is upgradesWithName => item !== null
    );

    return (
        <div className="min-h-screen bg-gray-900">
            <Navbar />

            {/* Main layout container */}
            <div className="flex min-h-[calc(100vh-64px)]"> {/* Adjust 64px based on your navbar height */}
                {/* Main content area that will shrink with sidebar */}
                <div className="flex-1 p-4 transition-all duration-300 mr-[300px]">
                    {/* Content wrapper */}
                    <div className="flex flex-col xl:flex-row gap-8 max-w-[2000px] mx-auto">
                        {/* Left column - Character info and equipment grids */}
                        <div className="xl:w-auto flex flex-col">
                            {/* Character info section */}
                            <div className="mb-6 flex flex-col items-center">
                                <h2 className="text-3xl font-bold mb-4 text-white">{actualname}</h2>

                                {/* Character image */}
                                {character.data.m_strIconHeroCard && (
                                    <Image
                                        src={character.data.m_strIconHeroCard as string}
                                        alt={actualname}
                                        width={120}
                                        height={120}
                                        className="rounded-full mb-4 object-none select-none pointer-events-none"
                                        style={{
                                            maxWidth: "100%",
                                            height: "auto"
                                        }}
                                    />
                                )}

                                {/* Level slider */}
                                <div className="w-full max-w-sm mb-4">
                                    <label className="block text-m font-medium text-amber-500 mb-2">
                                        Character Level: <span className="text-[#70F8C1]">{characterLevel}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max={maxLevel}
                                        value={characterLevel}
                                        onChange={handleLevelChange}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                                    />
                                </div>

                                {/* Budget input */}
                                <div className="w-full max-w-sm mb-4">
                                    <label className="block text-sm font-medium text-amber-500 mb-2">
                                        Budget:
                                    </label>
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={handleBudgetChange}
                                        min={character.data.m_mapLevelInfo[characterLevel.toString() as keyof typeof character.data.m_mapLevelInfo]['m_unRequiredGold']}
                                        className="w-full p-2 bg-custom-bg border border-amber-500 text-[#70F8C1] rounded-lg text-center"
                                    />
                                </div>

                                {/* Cost display */}
                                <p className="text-amber-500 mb-4">
                                    Total Cost: <span className="text-[#70F8C1]">{totalCost}</span>
                                    <span className="text-lg font-bold"> / </span>
                                    <span className="text-[#70F8C1]">{budget}</span>
                                </p>

                                {/* Skill icons */}
                                <div className="flex space-x-2 mb-6">
                                    {skillIcons.map((skillIcon, index) => (
                                        <div key={index} className="relative border-2 border-[#dbb2f7] rounded-full p-1">
                                            <Image
                                                src={skillIcon}
                                                alt={`Skill ${index + 1}`}
                                                width={50}
                                                height={50}
                                                className="rounded-full cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => handleSkillUpgrade(index)}
                                                style={{
                                                    maxWidth: "100%",
                                                    height: "auto"
                                                }}
                                            />
                                            <div className="absolute bottom-0 right-0 bg-[#8A55B3] rounded-full w-5 h-5 flex items-center justify-center text-white text-xs">
                                                {skillUpgrades[index].length}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Equipment grids */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <ItemGrid
                                    title="Weapon"
                                    items={weaponItems}
                                    onItemToggle={(item) => handleItemToggle(item)}
                                />
                                <ItemGrid
                                    title="Vitality"
                                    items={vitalityItems}
                                    onItemToggle={(item) => handleItemToggle(item)}
                                />
                                <ItemGrid
                                    title="Spirit"
                                    items={spiritItems}
                                    onItemToggle={(item) => handleItemToggle(item)}
                                />
                                <ItemGrid
                                    title="Flex"
                                    items={utilityItems}
                                    onItemToggle={(item) => handleItemToggle(item)}
                                />
                            </div>
                        </div>

                        {/* Right column - Items section */}
                        <div className="flex-1">
                            {errorMessage && (
                                <div className="bg-red-500 text-white p-2 mb-4 rounded">
                                    {errorMessage}
                                </div>
                            )}

                            <input
                                type="text"
                                placeholder="Search upgrade items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
                            />

                            <div>
                                <h3 className="text-xl font-bold mb-4 text-white">Available Items</h3>
                                <ItemsDisplay
                                    items={filteredItems}
                                    onItemSelect={handleItemToggle}
                                    equippedItems={allEquippedItems}
                                    equipediItemsByCategory={getEquippedItemsbyCategory()}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats sidebar - Fixed width */}
                <div className="fixed top-0 right-0 w-[300px] h-screen overflow-y-auto">
                    <StatsSidebar
                        characterStats={currentStats}
                        characterName={heroName}
                        characterClass={character.data._class as string}
                        characterSkillsData={skillStats}
                        skillLabels={skillDG}
                        skillImages={skillIcons}
                        skillUpgrades={skillUpgradeInfo}
                    />
                </div>
            </div>
        </div>
    );
};

export default CharacterBuilder;