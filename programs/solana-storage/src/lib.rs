use anchor_lang::prelude::*;

declare_id!("Ct8DpiUxGmfx2tKAMsfq34Fq2veDtfKVGjnhEn5uWc6z");

#[program]
pub mod solana_storage {
    use super::*;

    pub fn store_initial_value(ctx: Context<InitializeStorage>) -> Result<()> {
        let storage_balance =  &mut ctx.accounts.storage_balance;
        storage_balance.stored_value = 100;
        storage_balance.max_value = 1000;

        Ok(())
    }

    pub fn update_value(ctx: Context<UpdateStorage>) -> Result<()> {  
        let storage_balance = &mut ctx.accounts.storage_balance;
        require!(storage_balance.stored_value < 1000, StorageError::MaxValueExceeded);

        // Increment the stored value in increment of 100
        let new_value: u64 = storage_balance.stored_value + 100;

        // Ensure it does not exceed max_value
        if new_value > storage_balance.max_value {
            return Err(StorageError::MaxValueExceeded.into());
            
            } else {
            storage_balance.stored_value = new_value;
        }
        Ok(())
    }
    
}

#[derive(Accounts)]
pub struct InitializeStorage<'info> {
    #[account(
        init, 
        payer =  admin,
        space = 8 + 8 + 8,
    )]
    pub storage_balance: Account<'info, StoredData>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateStorage<'info> {
    #[account(mut)]
    pub storage_balance: Account<'info, StoredData>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct StoredData {
    pub stored_value: u64,
    pub max_value: u64,
}

#[error_code]
pub enum StorageError {
    #[msg("Cannot exceed max_value.")] // If you wanted to return an error instead of capping
    MaxValueExceeded,
}


