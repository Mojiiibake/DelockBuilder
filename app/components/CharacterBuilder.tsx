'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ItemGrid from './ItemGrid';
import StatsSidebar from './StatsSidebar';
import { ItemsDisplay, getCategory } from './ItemsDisplay';
<<<<<<< Updated upstream

import { AWithKey, Signature_base } from '../lib/abilityInterface';

=======
import { AWithKey, SkillsData, skillProperties, skillDisplayGroups } from '../lib/abilityInterface';
>>>>>>> Stashed changes
import { HeroWithKey } from '../lib/herointerface';
import { Upgrade_with_name } from '../lib/itemInterface';
import { allStats } from '../lib/dataUtils';
import Navbar from '../ui/Navbar';

// New interface for item modifiers
interface ItemModifier {
    itemkey: string;
    modifiers: { [key: string]: number };
}

interface CharacterBuilderProps {
    character: HeroWithKey;
    items: Upgrade_with_name[];
    initialStats: allStats;
    itemModifiers: ItemModifier[];
    abilities: AWithKey[];
}

const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ character, items, initialStats, itemModifiers, abilities }) => {
<<<<<<< Updated upstream


    const heroName = character.key.replace(/^hero_/, '').replace(/^\w/, c => c.toUpperCase());

=======
>>>>>>> Stashed changes
    const [searchTerm, setSearchTerm] = useState('');
    const [weaponItems, setWeaponItems] = useState<(Upgrade_with_name | null)[]>(Array(4).fill(null));
    const [vitalityItems, setVitalityItems] = useState<(Upgrade_with_name | null)[]>(Array(4).fill(null));
    const [spiritItems, setSpiritItems] = useState<(Upgrade_with_name | null)[]>(Array(4).fill(null));
    const [utilityItems, setUtilityItems] = useState<(Upgrade_with_name | null)[]>(Array(4).fill(null));
    const [currentStats, setCurrentStats] = useState<allStats>(initialStats);

    const [equippedAbilities, setEquippedAbilities] = useState<Signature_base[] | null>(
        abdatagrabber() ?? []
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

<<<<<<< Updated upstream

    function abdatagrabber() {
        const ability = abilities.find((element) => element.heroname === character.key);

        if (ability) {
            const abdata = ability.adata;
            return [abdata.ESlot_Signature_1, abdata.ESlot_Signature_2, abdata.ESlot_Signature_3, abdata.ESlot_Signature_4];
        }
    }

=======
    const heroName = character.key.replace(/^hero_/, '').replace(/^\w/, c => c.toUpperCase());
    let heroSkills = [] as SkillsData[];
    let skillProps = {} as skillProperties;
    let skillDG = [] as skillDisplayGroups[];
    for (let i = 0; i < abilities.length; i++) {
        if (abilities[i].heroname === character.key) {
            heroSkills = [ JSON.parse(JSON.stringify(abilities[i].adata.ESlot_Signature_1)), 
                         JSON.parse(JSON.stringify(abilities[i].adata.ESlot_Signature_2)),
                         JSON.parse(JSON.stringify(abilities[i].adata.ESlot_Signature_3)),
                         JSON.parse(JSON.stringify(abilities[i].adata.ESlot_Signature_4)) ];
            break;
        }

    }
    heroSkills.forEach((element) => {
        for (const [skey, value] of  Object.entries(element.m_mapAbilityProperties)) {
            if (parseFloat(value.m_strValue) !== 0) {
                skillProps[skey] = parseFloat(value.m_strValue);
            }
        }
    })

    let skey : keyof typeof skillProps;
    for (skey in skillProps) {
        let slabel : string;
        if (skey.includes("Ability")) {
            slabel = skey.replace("Ability", '').replace(/([A-Z])/g, ' $1').trim();
        } else {
            slabel = skey.replace(/([A-Z])/g, ' $1').trim();
        }

        skillDG.push( {
            key: skey,
            name: slabel,
        })
    };
    
>>>>>>> Stashed changes
    useEffect(() => {
        setCurrentStats(initialStats);
    }, [initialStats]);

    useEffect(() => {
        const allEquippedItems = [...weaponItems, ...vitalityItems, ...spiritItems, ...utilityItems].filter(
            (item): item is Upgrade_with_name => item !== null
        );

        fetch('/api/calculateStats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                characterName: character.key.replace(/^hero_/, ''),
                equippedItems: allEquippedItems,
                heroSkills : heroSkills,
            }),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || 'Network response was not ok') });
                }
                return response.json();
            })
            .then(newStats => {
                setCurrentStats(newStats);
<<<<<<< Updated upstream
                const newAbilities = allEquippedItems.map(item => item.itemkey);
                //setEquippedAbilities(newAbilities);
=======
>>>>>>> Stashed changes
            })
            .catch(error => {
                console.error('Error calculating stats:', error);
                setErrorMessage(error.message || 'Error calculating stats');
            });
    }, [character, weaponItems, vitalityItems, spiritItems, utilityItems]);

    const handleItemToggle = (item: Upgrade_with_name) => {
        const category = getCategory(item.upgrade.m_eItemSlotType || '');
        let primaryGrid: (Upgrade_with_name | null)[];
        let setPrimaryGrid: React.Dispatch<React.SetStateAction<(Upgrade_with_name | null)[]>>;

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
        ].findIndex(equippedItem => equippedItem?.itemkey === item.itemkey);

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

    const filteredItems = items.filter((item) =>
        item.itemkey.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allEquippedItems = [...weaponItems, ...vitalityItems, ...spiritItems, ...utilityItems].filter(
        (item): item is Upgrade_with_name => item !== null
    );

    return (
        <div>
            <Navbar />
            <div className="flex mt-4">
                <div className={`p-4
                flex flex-col 2xl:flex-row
                w-full
                pr-[clamp(212px,calc(25vw+12px),312px)]
                `}>
                    <div className="flex flex-row 2xl:flex-col flex-wrap min-w-60">
                        <div className="mb-2 mr-8 flex flex-col items-center float-left">
                            <div className="">
                                <h2 className="text-3xl font-bold">{heroName}</h2>
                            </div>
                            {character.data.m_strIconHeroCard && (
                                <Image
                                    src={character.data.m_strIconHeroCard}
                                    alt={heroName}
                                    width={120}
                                    height={120}
                                    className="rounded-full mb-2 object-none"
                                />
                            )}
                        </div>
                        <div className="justify-items-center grid md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-1 gap-x-8 gap-y-1 2xl:gap-1 mb-4">
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

                    <div className="w-full mr-[4%] mt-2">
                        {errorMessage && (
                            <div className="bg-red-500 text-white p-1 mb-2 rounded text-sm">
                                {errorMessage}
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Search upgrade items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-8 p-2 mb-4 bg-gray-700 text-white rounded"
                        />
                        <div className="mb-4">
                            <h3 className="text-xl font-bold mb-2">Available Items</h3>
                            <ItemsDisplay
                                items={filteredItems}
                                onItemSelect={handleItemToggle}
                                equippedItems={allEquippedItems}
                            />
                        </div>
                    </div>
                </div>
                <StatsSidebar
                    characterStats={currentStats || initialStats}
                    characterName={heroName}
                    characterClass={character.data._class}
                    characterSkillsData={skillProps}
                    skillLabels={skillDG}
                />
            </div>
        </div>
    );
};

export default CharacterBuilder;