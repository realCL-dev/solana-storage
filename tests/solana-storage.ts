import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { SolanaStorage } from '../target/types/solana_storage'
import { expect } from 'chai'

describe('solana-storage', () => {
  let fetchedAccount, provider, storageAccount, program

  beforeEach(async () => {
    provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider)

    program = anchor.workspace.solanaStorage as Program<SolanaStorage>

    const StorageAccount = anchor.web3.Keypair.generate()
    storageAccount = StorageAccount.publicKey

    await program.methods
      .storeInitialValue()
      .accounts({
        storageBalance: StorageAccount.publicKey,
        admin: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([StorageAccount])
      .rpc()

    fetchedAccount = await program.account.storedData.fetch(storageAccount)
  })

  it('Initializes the storage_balance account with the correct value!', async () => {
    expect(fetchedAccount.storedValue.toNumber()).to.equal(
      100,
      'The stored value should be 100'
    )
    console.log(
      "Successfully initialized 'storage_balance' with stored_value:",
      fetchedAccount.storedValue.toNumber()
    )
  })

  it('Updates the stored_value correctly when within bounds', async () => {
    for (let i = 1; i <= 8; i++) {
      await program.methods
        .updateValue()
        .accounts({
          storageBalance: storageAccount,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        })
        .rpc()
      fetchedAccount = await program.account.storedData.fetch(storageAccount)
      expect(fetchedAccount.storedValue.toNumber()).to.equal(
        i * 100 + 100,
        `Stored value should be ${i * 100 + 100} after ${i} update(s)`
      )
      console.log(
        `Stored value after ${i} update(s): ${fetchedAccount.storedValue.toNumber()}`
      )
    }
    console.log(
      `Stored value after 8 updates: ${fetchedAccount.storedValue.toNumber()}`
    )
  })

  it('throws an error when incrementing beyond the bound set', async () => {
    for (let i = 1; i <= 8; i++) {
      await program.methods
        .updateValue()
        .accounts({
          storageBalance: storageAccount,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        })
        .rpc()
      fetchedAccount = await program.account.storedData.fetch(storageAccount)
      expect(fetchedAccount.storedValue.toNumber()).to.equal(
        i * 100 + 100,
        `Stored value should be ${i * 100 + 100} after ${i} update(s)`
      )


    }
    try {
      await program.methods
        .updateValue()
        .accounts({
          storageBalance: storageAccount,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        })
        .rpc()
      // If we get here, the transaction didn't fail as expected
      throw new Error("Expected transaction to fail with MaxValueExceeded")
    } catch (error) {
      expect(error.message).to.include("MaxValueExceeded")
    }

    // Optionally, confirm the value is still capped
    fetchedAccount = await program.account.storedData.fetch(storageAccount)
    expect(fetchedAccount.storedValue.toNumber()).to.equal(1000, "value should be capped at 1000")
    console.log(
      `Stored value after error attempt: ${fetchedAccount.storedValue.toNumber()}`
    )
    console.log(
      `Stored value after 9 updates is still: ${fetchedAccount.storedValue.toNumber()}`
    )
  })
})
